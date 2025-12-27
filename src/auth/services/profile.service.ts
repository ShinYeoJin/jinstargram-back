import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

/**
 * 프로필 관리 서비스
 */
@Injectable()
export class ProfileService {
  constructor(private usersService: UsersService) {}

  /**
   * 사용자 프로필 조회
   */
  async getProfile(userId: number) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio || null,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(
    userId: number,
    updateData: { nickname?: string; profileImageUrl?: string | null; bio?: string | null }
  ) {
    const updatedUser = await this.usersService.update(userId, {
      nickname: updateData.nickname,
      profileImageUrl: updateData.profileImageUrl,
      bio: updateData.bio,
    });
    
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      nickname: updatedUser.nickname,
      profileImageUrl: updatedUser.profileImageUrl,
      bio: updatedUser.bio || null,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}

