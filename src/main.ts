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

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman 등
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      if (origin.startsWith('http://localhost')) return callback(null, true);
      callback(new Error('CORS blocked'));
    },
    credentials: true, // 쿠키 허용
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
