import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SacramentoService } from './sacramento.service';
import { SacramentoController } from './sacramento.controller';
import { Sacramento } from './Entities/sacramento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sacramento])],
  controllers: [SacramentoController],
  providers: [SacramentoService],
})
export class SacramentoModule {}
