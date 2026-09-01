import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicSacramentoController } from './solic-sacramento.controller';
import { SolicSacramentoService } from './solic-sacramento.service';
import { SolicSacramentoFileStorageService } from './solic-sacramento-file-storage.service';
import { SolicSacramento } from './Entities/solic-sacramento.entity';
import { HistorialRechazos } from './Entities/historial-rechazos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SolicSacramento, HistorialRechazos])],
  controllers: [SolicSacramentoController],
  providers: [SolicSacramentoService, SolicSacramentoFileStorageService],
})
export class SolicSacramentoModule {}
