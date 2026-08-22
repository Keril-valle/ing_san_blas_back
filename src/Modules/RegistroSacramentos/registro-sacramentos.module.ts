import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bautismo } from './Entities/bautismo.entity';
import { Comunion } from './Entities/comunion.entity';
import { Confirmacion } from './Entities/confirmacion.entity';
import { Matrimonio } from './Entities/matrimonio.entity';
import { BautismoService } from './bautismo.service';
import { ComunionService } from './comunion.service';
import { ConfirmacionService } from './confirmacion.service';
import { MatrimonioService } from './matrimonio.service';
import { BautismoController } from './bautismo.controller';
import { ComunionController } from './comunion.controller';
import { ConfirmacionController } from './confirmacion.controller';
import { MatrimonioController } from './matrimonio.controller';
import { BusquedaSacramentosController } from './busqueda-sacramentos.controller';
import { BusquedaSacramentosService } from './busqueda-sacramentos.service';
import { SacramentoModule } from './sacramento.module';
import { PersonaSacramento } from './Entities/persona-sacramento.entity';
import { ParroquiaSacramento } from './Entities/parroquia-sacramento.entity';
import { PresbiteroSacramento } from './Entities/presbitero-sacramento.entity';
import { SacramentoRegistro } from './Entities/sacramento-registro.entity';
import { BautismoRegistro } from './Entities/bautismo-registro.entity';
import { BautismoAbuelo } from './Entities/bautismo-abuelo.entity';
import { ComunionRegistro } from './Entities/comunion-registro.entity';
import { ConfirmacionRegistro } from './Entities/confirmacion-registro.entity';
import { MatrimonioRegistro } from './Entities/matrimonio-registro.entity';
import { BusquedaNormalizadaController } from './busqueda-normalizada.controller';
import { BusquedaNormalizadaService } from './busqueda-normalizada.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bautismo,
      Comunion,
      Confirmacion,
      Matrimonio,
      PersonaSacramento,
      ParroquiaSacramento,
      PresbiteroSacramento,
      SacramentoRegistro,
      BautismoRegistro,
      BautismoAbuelo,
      ComunionRegistro,
      ConfirmacionRegistro,
      MatrimonioRegistro,
    ]),
    SacramentoModule,
  ],
  controllers: [
    BautismoController,
    ComunionController,
    ConfirmacionController,
    MatrimonioController,
    BusquedaSacramentosController,
    BusquedaNormalizadaController,
  ],
  providers: [
    BautismoService,
    ComunionService,
    ConfirmacionService,
    MatrimonioService,
    BusquedaSacramentosService,
    BusquedaNormalizadaService,
  ],
})
export class RegistroSacramentosModule {}
