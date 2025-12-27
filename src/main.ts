import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 쿠키 파서 미들웨어
  app.use(cookieParser());

  // 전역 ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정: 모든 vercel.app + localhost 허용
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, 서버 간 호출 허용

      if (origin.endsWith('.vercel.app')) {
        console.log('[CORS] Allowed vercel.app:', origin);
        return callback(null, true);
      }

      if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
        console.log('[CORS] Allowed localhost:', origin);
        return callback(null, true);
      }

      console.warn(`[CORS] BLOCKED origin: ${origin}`);
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true, // 쿠키 전송 허용
  });

  // 서버 포트
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
