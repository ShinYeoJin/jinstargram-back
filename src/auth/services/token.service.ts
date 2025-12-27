import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 토큰 관리 서비스
 */
@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Access Token 발급
   */
  generateAccessToken(payload: { sub: number; username: string; email?: string | null }): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Refresh Token 발급
   */
  generateRefreshToken(userId: number): string {
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: refreshTokenExpiresIn }
    );
  }

  /**
   * Refresh Token 만료 시간 계산
   */
  calculateRefreshTokenExpiresAt(): Date {
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = new Date();
    const expiresInDays = refreshTokenExpiresIn.includes('d') 
      ? parseInt(refreshTokenExpiresIn.replace('d', ''), 10) 
      : 7;
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    return expiresAt;
  }

  /**
   * Refresh Token 검증
   */
  verifyRefreshToken(refreshToken: string): { sub: number; type: string } {
    const payload = this.jwtService.verify(refreshToken);
    if (payload.type !== 'refresh') {
      throw new Error('유효하지 않은 리프레시 토큰입니다.');
    }
    return payload;
  }
}

