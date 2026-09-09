import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import type { SendMailOptions } from '../Interfaces/mail-options.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: BrevoClient | null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY') ?? '';
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM_EMAIL') ??
      'no-reply@sanblas.local';
    this.fromName =
      this.configService.get<string>('MAIL_FROM_NAME') ?? 'Parroquia San Blas';

    // Sin API key no hay cliente (así en local se puede trabajar sin mandar correos de verdad)
    this.client = apiKey ? new BrevoClient({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn(
        'BREVO_API_KEY no configurada, los correos se omiten (solo se loguean)',
      );
    }
  }

  // Dice si realmente se pueden mandar correos o si estamos en modo "solo log"
  isEnabled(): boolean {
    return this.client !== null;
  }

  // Manda un correo transaccional por Brevo, si hay un fallo lanza el error para que el que llama decida qué hacer
  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.client) {
      this.logger.debug(
        `Correo omitido (sin BREVO_API_KEY): to=${options.to} subject=${options.subject}`,
      );
      return;
    }

    await this.client.transactionalEmails.sendTransacEmail({
      sender: { email: this.fromEmail, name: this.fromName },
      to: [{ email: options.to, name: options.toName ?? options.to }],
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
      tags: options.tags,
    });
  }
}
