import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import { CicaService } from './cica.service';
import { CicaController } from './cica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionCica])],
  controllers: [CicaController],
  providers: [CicaService],
})
export class CicaModule {}
