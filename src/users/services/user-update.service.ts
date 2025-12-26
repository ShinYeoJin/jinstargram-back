import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * 사용자 업데이트 관련 서비스
 */
@Injectable()
export class UserUpdateService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 사용자 정보 업데이트
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이메일 변경 시 중복 확인
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    // 사용자명 변경 시 중복 확인
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('이미 사용 중인 사용자명입니다.');
      }
    }

    // 비밀번호 변경 시 암호화
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);

    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * Refresh Token 업데이트
   */
  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
    refreshTokenExpiresAt: Date | null,
  ): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = refreshTokenExpiresAt;
      
      await this.usersRepository.save(user);
    } catch (error: any) {
      console.error('updateRefreshToken error:', error);
      console.error('userId:', userId);
      throw error;
    }
  }
}

