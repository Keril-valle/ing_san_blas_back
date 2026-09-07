import { Global, Module } from '@nestjs/common';
import { MailService } from './Services/mail.service';
import { DonacionMailService } from './Services/donacion-mail.service';

@Global() // global para no andar importándolo en cada módulo (donaciones hoy, sacramentos después)
@Module({
  providers: [MailService, DonacionMailService],
  exports: [MailService, DonacionMailService],
})
export class NotificationsModule {}
