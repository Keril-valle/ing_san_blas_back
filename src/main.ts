import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Helmet para mejorar la seguridad de la aplicación
  //estoy usando helmet para proteger la app de vulnerabilidades conocidas, como XSS, clickjacking, etc.
  //y la forma como funciona es que agrega cabeceras HTTP de seguridad a las respuestas del servidor, lo que ayuda a prevenir ataques comunes en aplicaciones web.
  app.use(helmet());

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });
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
