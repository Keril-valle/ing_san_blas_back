import helmet from 'helmet';
import { config as loadEnv } from 'dotenv';
import * as tls from 'node:tls';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './Common/Filters/global-exception.filter';
import { mapValidationErrors } from './Common/validation-errors';

loadEnv();

try {
  tls.setDefaultCACertificates([
    ...tls.getCACertificates(),
    ...tls.getCACertificates('system'),
  ]);
} catch {
  // Si Node no puede leer el almacén de Windows, se siguen usando los certificados embebidos
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultCorsOrigins = [
    'http://localhost:4200',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ];

  const corsOrigins =
    configuredCorsOrigins.length > 0
      ? [...new Set([...configuredCorsOrigins, ...defaultCorsOrigins])]
      : defaultCorsOrigins;

  // CORS primero para que los preflight OPTIONS se respondan antes que cualquier otro middleware
  app.enableCors({
    origin: corsOrigins,
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
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException(mapValidationErrors(errors)),
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
