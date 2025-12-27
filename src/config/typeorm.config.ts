import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // DB_SSL=true 일 때 SSL 사용 (Render PostgreSQL 등)
    // 기본값을 true로 두면 Render 같은 관리형 Postgres에 바로 연결 가능
    const useSsl =
      this.configService.get<string>('DB_SSL', 'true').toLowerCase() === 'true';

    // 포트를 명시적으로 파싱 (환경 변수는 문자열로 들어올 수 있음)
    const dbPort = this.configService.get<string>('DB_PORT', '5432');
    const port = parseInt(dbPort, 10);

    // 디버깅을 위한 로깅 (개발 환경에서만)
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'development') {
      console.log('Database Config:', {
        host: this.configService.get<string>('DB_HOST'),
        port: port,
        database: this.configService.get<string>('DB_DATABASE'),
        username: this.configService.get<string>('DB_USERNAME'),
        ssl: useSsl,
      });
    }

    return {
      // PostgreSQL 데이터베이스 설정
      // .env 예시)
      // DB_HOST=your-postgres-host
      // DB_PORT=5432
      // DB_USERNAME=your-username
      // DB_PASSWORD=your-password
      // DB_DATABASE=jinstargram
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: port || 5432, // 파싱 실패 시 기본값 5432 사용
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', ''),
      database: this.configService.get<string>('DB_DATABASE', 'todo_back'),
      entities: [User],
      synchronize: false, // 수동으로 스키마 관리 (중복 인덱스 에러 방지)
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      retryAttempts: 3,
      retryDelay: 3000,
      autoLoadEntities: true,
      // 명시적으로 public 스키마 사용 (스키마 지정 없음 = public 스키마)
      // Render Managed Postgres에서는 SSL 연결이 필요하므로 DB_SSL=true 로 두고 사용
      // 로컬에서 SSL을 끄고 싶으면 .env에 DB_SSL=false 로 설정
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      extra: useSsl
        ? {
            ssl: { rejectUnauthorized: false },
          }
        : undefined,
    };
  }
}

