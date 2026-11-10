import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donacion } from './Entities/donacion.entity';
import { DonacionesService } from './donaciones.service';
import { DonacionesController } from './donaciones.controller';
import { RecaptchaModule } from '../../Common/Recaptcha/recaptcha.module';

@Module({
  imports: [TypeOrmModule.forFeature([Donacion]), RecaptchaModule],
  controllers: [DonacionesController],
  providers: [DonacionesService],
})
export class DonacionesModule {}
