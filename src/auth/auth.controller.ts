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

  // ✅ 쿠키 옵션 공통 함수
  private getCookieOptions(maxAge: number = 60 * 60 * 1000) {
    // Render는 RENDER=true 환경변수가 자동 설정됨
    const isLocalhost = !process.env.RENDER && process.env.PORT === '3001';
    
    const options = {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: isLocalhost ? 'lax' as const : 'none' as const,
      maxAge,
      path: '/',
    };
    
    // 디버깅: 쿠키 옵션 로깅
    console.log('[Cookie] Options:', { isLocalhost, RENDER: process.env.RENDER, PORT: process.env.PORT, ...options });
    
    return options;
  }

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
    const user = await this.authService.validateUser(loginDto.id, loginDto.password);
    if (!user) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');

    const result = await this.authService.login(user);

    // ✅ 쿠키도 설정 (백업)
    const accessOpts = this.getCookieOptions();
    res.cookie('access_token', result.access_token, accessOpts);
    res.cookie('refresh_token', result.refresh_token, this.getCookieOptions(7 * 24 * 60 * 60 * 1000));

    // ✅ 응답에 토큰 포함 (Authorization header 방식 지원)
    return res.json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { userId: number } }) {
    return await this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: { user: { userId: number } }, @Body() updateProfileDto: UpdateProfileDto) {
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
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new BadRequestException('리프레시 토큰이 필요합니다.');

    const result = await this.authService.refreshAccessToken(refreshToken);

    // 새 Access Token 쿠키
    res.cookie('access_token', result.access_token, this.getCookieOptions());

    return res.json({ message: '토큰이 갱신되었습니다.' });
  }

  @Post('logout')
  async logout(@Request() req: { cookies?: { refresh_token?: string } }, @Response({ passthrough: false }) res: ExpressResponse) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(undefined, refreshToken);

    // ✅ Safari ITP 대응: clearCookie 대신 빈 값 + 즉시 만료로 덮어쓰기
    const isLocalhost = !process.env.RENDER && process.env.PORT === '3001';
    const expireOptions = {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: isLocalhost ? 'lax' as const : 'none' as const,
      path: '/',
      expires: new Date(0), // 1970년 = 즉시 만료
    };
    
    res.cookie('access_token', '', expireOptions);
    res.cookie('refresh_token', '', expireOptions);
    console.log('[Logout] Cookies expired');

    return res.json({ message: '로그아웃되었습니다.' });
  }
}
