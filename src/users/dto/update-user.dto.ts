import { IsEmail, IsString, MinLength, IsOptional, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @ValidateIf((o) => o.profileImageUrl !== null)
  @IsString()
  profileImageUrl?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;
}

