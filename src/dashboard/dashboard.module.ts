import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { InscripcionCatequesis } from '../Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { SolicSacramento } from '../Modules/Solicitudes/Entities/solic-sacramento.entity';
import { SacramentoRegistro } from '../Modules/RegistroSacramentos/Entities/sacramento-registro.entity';
import { Donacion } from '../Modules/Donaciones/Entities/donacion.entity';
import { Evento } from '../Modules/Eventos/Entities/evento.entity';
import { Usuario } from '../Users/Entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InscripcionCatequesis,
      SolicSacramento,
      SacramentoRegistro,
      Donacion,
      Evento,
      Usuario,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
