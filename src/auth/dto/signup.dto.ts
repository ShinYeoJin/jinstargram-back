import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUrl,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: '아이디는 필수입니다.' })
  @MinLength(3, { message: '아이디는 최소 3자 이상이어야 합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '아이디는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.',
  })
  id: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '닉네임은 필수입니다.' })
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  nickname: string;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  profileImageUrl?: string;
}

