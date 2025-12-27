import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * JWT 인증 Guard (CanActivate 방식)
 *
 * 이 Guard는 JWT 토큰을 검증하여 인증된 사용자만 접근할 수 있도록 보호합니다.
 * 쿠키 또는 Authorization 헤더에서 토큰을 읽습니다.
 *
 * 사용 예시:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile(@Request() req) {
 *   // req.user.userId로 인증된 사용자 ID 접근 가능
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & { cookies?: { access_token?: string; refresh_token?: string } };
    
    // 디버깅: 요청 정보 로깅
    console.log('[JwtAuthGuard] Request headers:', {
      authorization: request.headers.authorization ? 'Bearer ***' : undefined,
      cookie: request.headers.cookie ? '(exists)' : undefined,
      origin: request.headers.origin,
    });
    console.log('[JwtAuthGuard] Cookies:', {
      access_token: request.cookies?.access_token ? '(exists)' : undefined,
      refresh_token: request.cookies?.refresh_token ? '(exists)' : undefined,
    });
    
    // 쿠키에서 토큰 읽기 (우선순위)
    let token: string | undefined = request.cookies?.access_token;
    
    // 쿠키에 없으면 Authorization 헤더에서 읽기 (하위 호환성)
    if (!token) {
      token = this.extractTokenFromHeader(request);
    }

    console.log('[JwtAuthGuard] Token found:', token ? 'yes' : 'no');

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });

      // request.user에 사용자 정보 저장
      request['user'] = {
        userId: payload.sub,
        username: payload.username,
        email: payload.email,
      };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return true;
  }

  /**
   * Request Header에서 JWT 토큰 추출
   * Authorization: Bearer <token> 형식에서 토큰 추출
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
