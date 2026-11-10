import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecaptchaService } from './recaptcha.service';

@Module({
  imports: [ConfigModule],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class RecaptchaModule {}
