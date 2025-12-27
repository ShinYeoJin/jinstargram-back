import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserCreationService } from './services/user-creation.service';
import { UserUpdateService } from './services/user-update.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private userCreationService: UserCreationService,
    private userUpdateService: UserUpdateService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    return this.userCreationService.create(createUserDto);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    const { password, ...result } = user;
    // bio 필드가 없을 수 있으므로 안전하게 처리
    return {
      ...result,
      bio: (result as any).bio || null,
    } as Omit<User, 'password'>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { nickname } });
  }

  async createForSignup(
    id: string,
    password: string,
    nickname: string,
    profileImageUrl?: string,
  ): Promise<User> {
    return this.userCreationService.createForSignup(id, password, nickname, profileImageUrl);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    return this.userUpdateService.update(id, updateUserDto);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    await this.usersRepository.remove(user);
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
    refreshTokenExpiresAt: Date | null,
  ): Promise<void> {
    return this.userUpdateService.updateRefreshToken(userId, refreshToken, refreshTokenExpiresAt);
  }
}

