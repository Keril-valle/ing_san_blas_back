import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './Services/mail.service';
import { DonacionMailService } from './Services/donacion-mail.service';

@Global() // global para no andar importándolo en cada módulo (donaciones hoy, sacramentos después)
@Module({
  imports: [ConfigModule],
  providers: [MailService, DonacionMailService],
  exports: [MailService, DonacionMailService],
})
export class NotificationsModule {}
