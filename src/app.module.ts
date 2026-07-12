import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './Auth/auth.module';
import { UsuarioModule } from './Users/usuario.module';
import { Usuario } from './Users/Entities/usuario.entity';
import { SolicSacramento } from './Modules/Solicitudes/Entities/solic-sacramento.entity';
import { SolicSacramentoModule } from './Modules/Solicitudes/solic-sacramento.module';
import { Evento } from './Modules/Eventos/Entities/evento.entity';
import { EventosModule } from './Modules/Eventos/evento.module';
import { Donacion } from './Modules/Donaciones/Entities/donacion.entity';
import { DonacionesModule } from './Modules/Donaciones/donaciones.module';

@Module({
  imports: [
    // Carga el .env una sola vez y lo deja disponible en toda la app (isGlobal: true)
    // sin esto, ConfigService no tendría de dónde leer DATABASE_URL más abajo.
    ConfigModule.forRoot({ isGlobal: true }),

    // Configuración de TypeORM con Postgres (Supabase).
    // forRootAsync en vez de forRoot porque necesitamos inyectar ConfigService
    // para leer la connection string del .env antes de armar la conexión.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [Usuario, SolicSacramento, Evento, Donacion],
        synchronize: false, // false: en BD real con datos, el schema se maneja con migraciones, no automágicamente
        ssl: {
          rejectUnauthorized: false, // Supabase exige conexión SSL
        },
      }),
    }),

    // Configuración del módulo de limitación de solicitudes (throttling)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, //el limite de peticiones por minuto es de 10, si se supera este limite se bloquea la IP por 1 minuto
        limit: 10,
      },
    ]),
    UsuarioModule,
    AuthModule,
    SolicSacramentoModule,
    EventosModule,
    DonacionesModule,
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