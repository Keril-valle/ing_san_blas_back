import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './Services/mail.service';
import { DonacionMailService } from './Services/donacion-mail.service';
import { CatequesisMailService } from './Services/catequesis-mail.service';

@Global() // global para no andar importándolo en cada módulo (donaciones hoy, sacramentos después)
@Module({
  imports: [ConfigModule],
  providers: [MailService, DonacionMailService, CatequesisMailService],
  exports: [MailService, DonacionMailService, CatequesisMailService],
})
export class NotificationsModule {}
