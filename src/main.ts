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
  // 추가 허용 origins (환경변수에서)
  const additionalOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];
  
  console.log('=== CORS Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Additional origins:', additionalOrigins);
  console.log('*.vercel.app domains: ALLOWED');
  console.log('localhost:3000: ALLOWED');
  
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없으면 허용 (서버 간 요청, Postman 등)
      if (!origin) {
        return callback(null, true);
      }
      
      // *.vercel.app 도메인 전체 허용 (프로덕션 + Preview)
      if (origin.endsWith('.vercel.app')) {
        console.log('[CORS] Allowed (vercel.app):', origin);
        return callback(null, true);
      }
      
      // localhost 개발 환경 허용
      if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
        console.log('[CORS] Allowed (localhost):', origin);
        return callback(null, true);
      }
      
      // 추가 허용 origins 확인
      if (additionalOrigins.includes(origin)) {
        console.log('[CORS] Allowed (additional):', origin);
        return callback(null, true);
      }
      
      // 그 외는 차단
      console.warn(`[CORS] BLOCKED origin: ${origin}`);
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();

