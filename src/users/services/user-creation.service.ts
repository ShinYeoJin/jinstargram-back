import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * 사용자 생성 관련 서비스
 */
@Injectable()
export class UserCreationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 일반 사용자 생성 (이메일 포함)
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // 이메일 중복 확인
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 사용자명 중복 확인
    const existingUsername = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // 비밀번호 제외하고 반환
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * 회원가입용 사용자 생성 (이메일 불필요)
   */
  async createForSignup(
    id: string,
    password: string,
    nickname: string,
    profileImageUrl?: string,
  ): Promise<User> {
    // 아이디 중복 확인
    const existingUser = await this.usersRepository.findOne({
      where: { username: id },
    });
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }

    // 닉네임 중복 확인
    const existingNickname = await this.usersRepository.findOne({
      where: { nickname },
    });
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = this.usersRepository.create({
      username: id,
      password: hashedPassword,
      nickname,
      profileImageUrl: profileImageUrl || null,
      email: null, // signup에서는 email이 필요 없음
    });

    return await this.usersRepository.save(user);
  }
}

