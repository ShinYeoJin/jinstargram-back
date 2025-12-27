import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie Parser
  app.use(cookieParser());

  // ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // 서버 간 요청(Postman 등)
      if (origin.endsWith('.vercel.app')) return callback(null, true); // Vercel 모든 도메인
      if (origin.startsWith('http://localhost')) return callback(null, true); // 개발환경
      callback(new Error('CORS blocked'));
    },
    credentials: true, // 쿠키 전송 허용 필수
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
