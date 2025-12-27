import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Cookie Parser 미들웨어 추가 (쿠키 읽기/쓰기)
  app.use(cookieParser());
  
  // ValidationPipe 전역 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // CORS 설정 (프론트엔드와 통신을 위해)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];
  
  // 디버깅: 허용된 origins 로깅
  console.log('=== CORS Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ALLOWED_ORIGINS env:', process.env.ALLOWED_ORIGINS);
  console.log('Parsed origins:', allowedOrigins);
  
  app.enableCors({
    origin: (origin, callback) => {
      console.log('[CORS] Request from origin:', origin);
      // origin이 없거나 허용된 origin 목록에 있으면 허용
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] BLOCKED origin: ${origin}`);
        console.warn('[CORS] Allowed origins:', allowedOrigins);
        callback(new Error('CORS 정책에 의해 차단되었습니다.'));
      }
    },
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();

