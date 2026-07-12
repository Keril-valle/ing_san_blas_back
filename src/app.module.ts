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
import { Bautismo } from './Modules/RegistroSacramentos/Entities/bautismo.entity';
import { Comunion } from './Modules/RegistroSacramentos/Entities/comunion.entity';
import { Confirmacion } from './Modules/RegistroSacramentos/Entities/confirmacion.entity';
import { Matrimonio } from './Modules/RegistroSacramentos/Entities/matrimonio.entity';
import { RegistroSacramentosModule } from './Modules/RegistroSacramentos/registro-sacramentos.module';
import { InscripcionCatequesis } from './Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { Catequizando } from './Modules/Catequesis/Entities/catequizando.entity';
import { BautismoCatequizando } from './Modules/Catequesis/Entities/bautismo-catequizando.entity';
import { AdecuacionCatequizando } from './Modules/Catequesis/Entities/adecuacion-catequizando.entity';
import { CondicionSaludCatequizando } from './Modules/Catequesis/Entities/condicion-salud-catequizando.entity';
import { MadreCatequizando } from './Modules/Catequesis/Entities/madre-catequizando.entity';
import { PagoInscripcionCatequesis } from './Modules/Catequesis/Entities/pago-inscripcion-catequesis.entity';
import { PersonaInscribeCatequesis } from './Modules/Catequesis/Entities/persona-inscribe-catequesis.entity';
import { CatequesisModule } from './Modules/Catequesis/catequesis.module';

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
        entities: [Usuario, SolicSacramento, Evento, Donacion, Bautismo, Comunion, Confirmacion, Matrimonio, InscripcionCatequesis, Catequizando, BautismoCatequizando, AdecuacionCatequizando, CondicionSaludCatequizando, MadreCatequizando, PagoInscripcionCatequesis, PersonaInscribeCatequesis],
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
    RegistroSacramentosModule,
    CatequesisModule,
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