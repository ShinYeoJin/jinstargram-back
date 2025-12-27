import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔴 이 순서가 매우 중요
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Postman / Server-to-server
      if (!origin) return callback(null, true);

      // ✅ 모든 Vercel (Preview + Prod)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // ✅ Local dev
      if (origin === 'http://localhost:3000') {
        return callback(null, true);
      }

      return callback(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 10000;
  await app.listen(port);
}

bootstrap();
