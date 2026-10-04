import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './Auth/auth.module';
import { UsuarioModule } from './Users/usuario.module';
import { LandingModule } from './landing/landing.module';
import { SolicSacramentoModule } from './Modules/Solicitudes/solic-sacramento.module';
import { EventosModule } from './Modules/Eventos/evento.module';
import { DonacionesModule } from './Modules/Donaciones/donaciones.module';
import { RegistroSacramentosModule } from './Modules/RegistroSacramentos/registro-sacramentos.module';
import { CatequesisModule } from './Modules/Catequesis/catequesis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './Notifications/notifications.module';
import { ENTIDADES } from './entities';
import { CommonModule } from './Common/common.module';

@Module({
  imports: [
    // Carga el .env una sola vez y lo deja disponible en toda la app (isGlobal: true)
    // sin esto, ConfigService no tendría de dónde leer DATABASE_URL más abajo.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración de TypeORM con Postgres (Supabase).
    // forRootAsync en vez de forRoot porque necesitamos inyectar ConfigService
    // para leer la connection string del .env antes de armar la conexión.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: ENTIDADES,
        synchronize: false, // false: en BD real con datos, el schema se maneja con migraciones, no automáticamente
        ssl: {
          rejectUnauthorized: false, // Supabase exige conexión SSL
        },
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    UsuarioModule,
    AuthModule,
    SolicSacramentoModule,
    EventosModule,
    DonacionesModule,
    RegistroSacramentosModule,
    CatequesisModule,
    LandingModule,
    DashboardModule,
    NotificationsModule, // correos (Brevo), global así que queda disponible para todos los módulos
    CommonModule, // utilidades compartidas (subida a Cloudinary), global
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
