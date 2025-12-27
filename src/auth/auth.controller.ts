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

  // 공통 쿠키 옵션 함수
  private getCookieOptions(isProduction: boolean, maxAge: number = 60 * 60 * 1000) {
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      maxAge,
      path: '/',
      domain: isProduction ? '.onrender.com' : undefined, // Render 배포 환경용
    };
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
    try {
      const user = await this.authService.validateUser(loginDto.id, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
      }

      const result = await this.authService.login(user);
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = this.getCookieOptions(isProduction);

      console.log('[Login] Cookie options:', { ...cookieOptions, NODE_ENV: process.env.NODE_ENV });

      res.cookie('access_token', result.access_token, cookieOptions);
      console.log('[Login] access_token cookie set');

      res.cookie('refresh_token', result.refresh_token, this.getCookieOptions(isProduction, 7 * 24 * 60 * 60 * 1000));
      console.log('[Login] refresh_token cookie set');

      const { access_token, refresh_token, ...responseData } = result;
      return res.json(responseData);
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Login controller error:', error);
      const errorMessage = error?.message || '로그인 처리 중 오류가 발생했습니다.';
      throw new BadRequestException(errorMessage);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { userId: number } }) {
    return await this.authService.getProfile(req.user.userId);
  }

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
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('리프레시 토큰이 필요합니다.');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', result.access_token, this.getCookieOptions(isProduction));

    return res.json({ message: '토큰이 갱신되었습니다.' });
  }

  @Post('logout')
  async logout(
    @Request() req: { user?: { userId: number }; cookies?: { refresh_token?: string } },
    @Response({ passthrough: false }) res: ExpressResponse
  ) {
    const userId = req.user?.userId;
    const refreshToken = req.cookies?.refresh_token;

    await this.authService.logout(userId, refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', { path: '/', domain: isProduction ? '.onrender.com' : undefined });
    res.clearCookie('refresh_token', { path: '/', domain: isProduction ? '.onrender.com' : undefined });

    return res.json({ message: '로그아웃되었습니다.' });
  }
}
