import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicSacramentoController } from './solic-sacramento.controller';
import { SolicSacramentoService } from './solic-sacramento.service';
import { SolicSacramento } from './Entities/solic-sacramento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SolicSacramento])],
  controllers: [SolicSacramentoController],
  providers: [SolicSacramentoService],
})
export class SolicSacramentoModule {}
