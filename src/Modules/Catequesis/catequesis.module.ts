import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionCatequesis } from './Entities/inscripcion-catequesis.entity';
import { Catequizando } from './Entities/catequizando.entity';
import { BautismoCatequizando } from './Entities/bautismo-catequizando.entity';
import { AdecuacionCatequizando } from './Entities/adecuacion-catequizando.entity';
import { CondicionSaludCatequizando } from './Entities/condicion-salud-catequizando.entity';
import { MadreCatequizando } from './Entities/madre-catequizando.entity';
import { PagoInscripcionCatequesis } from './Entities/pago-inscripcion-catequesis.entity';
import { PersonaInscribeCatequesis } from './Entities/persona-inscribe-catequesis.entity';
import { CatequesisService } from './catequesis.service';
import { CatequesisExportService } from './catequesis-export.service';
import { CatequesisFileStorageService } from './catequesis-file-storage.service';
import { CatequesisController } from './catequesis.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InscripcionCatequesis,
      Catequizando,
      BautismoCatequizando,
      AdecuacionCatequizando,
      CondicionSaludCatequizando,
      MadreCatequizando,
      PagoInscripcionCatequesis,
      PersonaInscribeCatequesis,
    ]),
  ],
  controllers: [CatequesisController],
  providers: [
    CatequesisService,
    CatequesisExportService,
    CatequesisFileStorageService,
  ],
})
export class CatequesisModule {}
