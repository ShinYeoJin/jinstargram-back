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
  private getCookieOptions(isProduction: boolean, maxAge: number = 60 * 60 * 1000) {
    return {
      httpOnly: true,
      secure: isProduction,                 // HTTPS에서만 전송
      sameSite: isProduction ? 'none' as const : 'lax' as const, // cross-site 허용
      maxAge,
      path: '/',
      // domain 제거 → cross-site 쿠키 문제 해결
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
    const user = await this.authService.validateUser(loginDto.id, loginDto.password);
    if (!user) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');

    const result = await this.authService.login(user);
    const isProduction = process.env.NODE_ENV === 'production';

    // ✅ Access Token 쿠키
    res.cookie('access_token', result.access_token, this.getCookieOptions(isProduction));

    // ✅ Refresh Token 쿠키 (7일)
    res.cookie('refresh_token', result.refresh_token, this.getCookieOptions(isProduction, 7 * 24 * 60 * 60 * 1000));

    const { access_token, refresh_token, ...responseData } = result;
    return res.json(responseData);
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
    const isProduction = process.env.NODE_ENV === 'production';

    // 새 Access Token 쿠키
    res.cookie('access_token', result.access_token, this.getCookieOptions(isProduction));

    return res.json({ message: '토큰이 갱신되었습니다.' });
  }

  @Post('logout')
  async logout(@Request() req: { cookies?: { refresh_token?: string } }, @Response({ passthrough: false }) res: ExpressResponse) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(undefined, refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';

    // ✅ 쿠키 제거
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return res.json({ message: '로그아웃되었습니다.' });
  }
}
