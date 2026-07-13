import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // CORS primero para que los preflight OPTIONS se respondan antes que cualquier otro middleware
  app.enableCors({
    origin:
      corsOrigins.length > 0
        ? corsOrigins
        : ['http://localhost:4200', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Helmet después de CORS — agrega cabeceras de seguridad sin interferir con CORS
  app.use(helmet());
  //esto sirve para usar class validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
