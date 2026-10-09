import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionCatequesisBautismo } from './Entities/inscripcion-catequesis-bautismo.entity';
import { CatequesisBautismoService } from './catequesis-bautismo.service';
import { CatequesisBautismoController } from './catequesis-bautismo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionCatequesisBautismo])],
  controllers: [CatequesisBautismoController],
  providers: [CatequesisBautismoService],
})
export class CatequesisBautismoModule {}
