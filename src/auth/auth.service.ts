import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { ProfileService } from './services/profile.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private profileService: ProfileService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      const payload = { email: user.email, sub: user.id, username: user.username };
      return {
        access_token: this.tokenService.generateAccessToken(payload),
        user,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * 사용자 로그인 처리 및 토큰 발급
   * @param user - 인증된 사용자 객체 (password 제외)
   * @returns Access Token, Refresh Token 및 사용자 정보
   */
  async login(user: Omit<User, 'password'>) {
    try {
      const payload = { 
        sub: user.id, 
        username: user.username,
        email: user.email || null,
      };
      
      // 토큰 발급
      const accessToken = this.tokenService.generateAccessToken(payload);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);
      const refreshTokenExpiresAt = this.tokenService.calculateRefreshTokenExpiresAt();
      
      // Refresh Token을 데이터베이스에 저장
      try {
        await this.usersService.updateRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);
      } catch (dbError: any) {
        console.error('Failed to update refresh token:', dbError);
        throw new BadRequestException('토큰 저장 중 오류가 발생했습니다.');
      }
      
      // 사용자 정보 안전하게 구성
      const userResponse = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || null,
        profileImageUrl: user.profileImageUrl || null,
        email: user.email || null,
        createdAt: user.createdAt ? user.createdAt : new Date(),
        updatedAt: user.updatedAt ? user.updatedAt : new Date(),
      };
      
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userResponse,
      };
    } catch (error: any) {
      console.error('Login service error:', error);
      console.error('Error stack:', error?.stack);
      // 이미 처리된 에러는 그대로 throw
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      // 예상치 못한 에러
      throw new BadRequestException(error?.message || '로그인 처리 중 오류가 발생했습니다.');
    }
  }

  async signup(signupDto: SignupDto): Promise<boolean> {
    try {
      await this.usersService.createForSignup(
        signupDto.id,
        signupDto.password,
        signupDto.nickname,
        signupDto.profileImageUrl,
      );
      return true;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  async validateUser(id: string, password: string): Promise<Omit<User, 'password'> | null> {
    // 아이디(username)로 사용자 찾기
    const user = await this.usersService.findByUsername(id);
    if (!user) {
      return null;
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...result } = user;
    return result as Omit<User, 'password'>;
  }

  async getProfile(userId: number) {
    return this.profileService.getProfile(userId);
  }

  async updateProfile(userId: number, updateProfileDto: { nickname?: string; profileImageUrl?: string | null; bio?: string | null }) {
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    if (!username || username.trim().length === 0) {
      return { available: false };
    }
    const user = await this.usersService.findByUsername(username);
    return { available: !user };
  }

  async checkNicknameAvailability(nickname: string): Promise<{ available: boolean }> {
    if (!nickname || nickname.trim().length === 0) {
      return { available: false };
    }
    const user = await this.usersService.findByNickname(nickname);
    return { available: !user };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Refresh Token 검증
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      
      // 데이터베이스에서 사용자 조회 및 Refresh Token 확인
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }
      
      // Refresh Token 만료 확인
      if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
        // 만료된 토큰 제거
        await this.usersService.updateRefreshToken(payload.sub, null, null);
        throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
      }
      
      // 새로운 Access Token 발급
      const newPayload = {
        sub: user.id,
        username: user.username,
        email: user.email || null,
      };
      const accessToken = this.tokenService.generateAccessToken(newPayload);
      
      return {
        access_token: accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.');
    }
  }

  async logout(userId?: number, refreshToken?: string) {
    let targetUserId: number | null = null;

    // userId가 제공된 경우 (Access Token으로 인증된 경우)
    if (userId) {
      targetUserId = userId;
    }
    // Refresh Token이 제공된 경우 (Access Token이 만료된 경우)
    else if (refreshToken) {
      try {
        // Refresh Token 검증
        const payload = this.tokenService.verifyRefreshToken(refreshToken);

        // 데이터베이스에서 사용자 조회 및 Refresh Token 확인
        const user = await this.usersService.findOne(payload.sub);
        if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
          throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
        }

        targetUserId = user.id;
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.');
      }
    } else {
      throw new BadRequestException('사용자 ID 또는 리프레시 토큰이 필요합니다.');
    }

    if (targetUserId) {
      // Refresh Token 제거
      await this.usersService.updateRefreshToken(targetUserId, null, null);
      return { message: '로그아웃되었습니다.' };
    }

    throw new UnauthorizedException('로그아웃에 실패했습니다.');
  }
}

