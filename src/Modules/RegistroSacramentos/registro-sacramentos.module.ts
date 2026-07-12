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

@Module({
  imports: [
    TypeOrmModule.forFeature([Bautismo, Comunion, Confirmacion, Matrimonio]),
  ],
  controllers: [
    BautismoController,
    ComunionController,
    ConfirmacionController,
    MatrimonioController,
  ],
  providers: [
    BautismoService,
    ComunionService,
    ConfirmacionService,
    MatrimonioService,
  ],
})
export class RegistroSacramentosModule {}
