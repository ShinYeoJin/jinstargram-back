import { Controller, Post, Body, UseGuards, Get, Patch, Request, Response, UnauthorizedException, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards';
import { Response as ExpressResponse } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<boolean> {
    return await this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Response({ passthrough: false }) res: ExpressResponse) {
    try {
      // 직접 검증 방식 사용
      const user = await this.authService.validateUser(loginDto.id, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
      
      const result = await this.authService.login(user);
      
      // 쿠키에 토큰 설정
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions: any = {
        httpOnly: true, // JavaScript로 접근 불가 (XSS 방지)
        secure: isProduction, // HTTPS에서만 전송 (프로덕션)
        sameSite: isProduction ? 'none' as const : 'lax' as const, // 크로스 도메인 허용 (프로덕션)
        maxAge: 60 * 60 * 1000, // 1시간 (Access Token 만료 시간)
        path: '/',
      };
      
      try {
        // Access Token 쿠키 설정
        res.cookie('access_token', result.access_token, cookieOptions);
        
        // Refresh Token 쿠키 설정 (7일)
        res.cookie('refresh_token', result.refresh_token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });
      } catch (cookieError) {
        console.error('Cookie setting error:', cookieError);
        throw new BadRequestException('쿠키 설정 중 오류가 발생했습니다.');
      }
      
      // 응답에서 토큰 제거 (쿠키에만 저장)
      const { access_token, refresh_token, ...responseData } = result;
      return res.json(responseData);
    } catch (error: any) {
      // 이미 처리된 에러는 그대로 throw
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      // 예상치 못한 에러는 로깅하고 상세 정보 포함
      console.error('Login controller error:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error message:', error?.message);
      console.error('Error name:', error?.name);
      console.error('Login DTO:', { id: loginDto.id, passwordLength: loginDto.password?.length });
      
      // 원래 에러 메시지 유지 (더 구체적인 정보 제공)
      const errorMessage = error?.message || '로그인 처리 중 오류가 발생했습니다.';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * 현재 로그인한 사용자의 프로필 조회
   * @param req - JWT 인증된 요청 객체 (req.user.userId 포함)
   * @returns 사용자 프로필 정보
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { userId: number } }) {
    return await this.authService.getProfile(req.user.userId);
  }

  /**
   * 현재 로그인한 사용자의 프로필 업데이트
   * @param req - JWT 인증된 요청 객체 (req.user.userId 포함)
   * @param updateProfileDto - 업데이트할 프로필 데이터
   * @returns 업데이트된 프로필 정보
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: { user: { userId: number } },
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return await this.authService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return await this.authService.checkUsernameAvailability(username);
  }

  @Get('check-nickname')
  async checkNickname(@Query('nickname') nickname: string) {
    return await this.authService.checkNicknameAvailability(nickname);
  }

  @Post('refresh')
  async refreshToken(@Request() req: { cookies?: { refresh_token?: string } }, @Response({ passthrough: false }) res: ExpressResponse) {
    // 쿠키에서 Refresh Token 읽기
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new BadRequestException('리프레시 토큰이 필요합니다.');
    }
    
    const result = await this.authService.refreshAccessToken(refreshToken);
    
    // 새로운 Access Token을 쿠키에 설정
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000, // 1시간
      path: '/',
    });
    
    // 응답에서 토큰 제거 (쿠키에만 저장)
    return res.json({ message: '토큰이 갱신되었습니다.' });
  }

  /**
   * 사용자 로그아웃 처리
   * Access Token이 만료되어도 Refresh Token만으로 로그아웃 가능
   * @param req - 요청 객체 (JWT 인증 시 req.user.userId 포함)
   * @param body - Refresh Token (선택적)
   * @returns 로그아웃 성공 여부
   */
  @Post('logout')
  async logout(
    @Request() req: { user?: { userId: number }; cookies?: { refresh_token?: string } },
    @Response({ passthrough: false }) res: ExpressResponse
  ) {
    const userId = req.user?.userId;
    // 쿠키에서 Refresh Token 읽기
    const refreshToken = req.cookies?.refresh_token;

    await this.authService.logout(userId, refreshToken);
    
    // 쿠키 제거
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    
    return res.json({ message: '로그아웃되었습니다.' });
  }
}

