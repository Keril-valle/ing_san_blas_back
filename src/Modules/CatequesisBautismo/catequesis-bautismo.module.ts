import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionCatequesisBautismo } from './Entities/inscripcion-catequesis-bautismo.entity';
import { CatequesisBautismoService } from './catequesis-bautismo.service';
import { CatequesisBautismoController } from './catequesis-bautismo.controller';
import { BautismoExportService } from './bautismo-export.service';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionCatequesisBautismo])],
  controllers: [CatequesisBautismoController],
  providers: [CatequesisBautismoService, BautismoExportService],
})
export class CatequesisBautismoModule {}
