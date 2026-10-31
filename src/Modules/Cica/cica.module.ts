import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import { CicaService } from './cica.service';
import { CicaController } from './cica.controller';
import { CicaExportService } from './cica-export.service';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionCica])],
  controllers: [CicaController],
  providers: [CicaService, CicaExportService],
})
export class CicaModule {}
