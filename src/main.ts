import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 쿠키 미들웨어
  app.use(cookieParser());

  // 글로벌 ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정: 모든 vercel.app 도메인 + localhost 허용
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman 등 서버간 요청 허용
      if (origin.endsWith('.vercel.app')) return callback(null, true); // Production + Preview
      if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001') return callback(null, true);

      console.warn(`[CORS] BLOCKED origin: ${origin}`);
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true, // 쿠키 전송 허용
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
