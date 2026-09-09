import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import type { SendMailOptions } from '../Interfaces/mail-options.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: BrevoClient | null | undefined;
  private warnedMissingKey = false;

  constructor(private readonly configService: ConfigService) {}

  private leerDato(clave: string, respaldo: string): string {
    const valor =
      this.configService.get<string>(clave)?.trim() ||
      process.env[clave]?.trim() ||
      '';
    return valor || respaldo;
  }

  private obtenerCliente(): BrevoClient | null {
    if (this.client !== undefined) {
      return this.client;
    }

    const apiKey =
      this.configService.get<string>('BREVO_API_KEY')?.trim() ||
      process.env.BREVO_API_KEY?.trim() ||
      '';

    this.client = apiKey ? new BrevoClient({ apiKey }) : null;
    if (!this.client && !this.warnedMissingKey) {
      this.warnedMissingKey = true;
      this.logger.warn(
        'BREVO_API_KEY no configurada, los correos se omiten (solo se loguean)',
      );
    }
    return this.client;
  }

  isEnabled(): boolean {
    return this.obtenerCliente() !== null;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const client = this.obtenerCliente();
    if (!client) {
      this.logger.warn(
        `Correo omitido (sin BREVO_API_KEY): to=${options.to} subject=${options.subject}`,
      );
      return;
    }

    const fromEmail = this.leerDato('MAIL_FROM_EMAIL', 'no-reply@sanblas.local');
    const fromName = this.leerDato('MAIL_FROM_NAME', 'Parroquia San Blas');

    try {
      await client.transactionalEmails.sendTransacEmail({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: options.to, name: options.toName ?? options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        tags: options.tags,
      });
    } catch (error) {
      const causa =
        error instanceof Error &&
        'cause' in error &&
        error.cause instanceof Error
          ? `${error.cause.name}: ${error.cause.message}`
          : undefined;
      const detalle = error instanceof Error ? error.message : String(error);
      throw new Error(
        causa ? `${detalle} (${causa})` : detalle,
      );
    }
  }
}
