import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './Auth/auth.module';
import { UsuarioModule } from './Users/usuario.module';
import { Usuario } from './Users/Entities/usuario.entity';

@Module({
  imports: [
    // Configuración de TypeORM con SQLite en memoria para desarrollo y pruebas.
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',  // BD en RAM, no requiere servidor
      entities: [Usuario],
      synchronize: true,
    }),
// Configuración del módulo de limitación de solicitudes (throttling)
    ThrottlerModule.forRoot([{
      ttl: 60000,//el limite de peticiones por minuto es de 10, si se supera este limite se bloquea la IP por 1 minuto
      limit: 10,
    }]),
    UsuarioModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
// Configuración del guard de limitación de solicitudes (throttling) a nivel global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
