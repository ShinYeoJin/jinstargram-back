import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './services/token.service';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true, // JwtModule을 Global로 설정하여 모든 모듈에서 사용 가능하게 함
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        const accessTokenExpiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h';
        const refreshTokenExpiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
        
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: accessTokenExpiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, ProfileService],
  exports: [AuthService],
})
export class AuthModule {}

