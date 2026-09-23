import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import {
  renderRecuperacionContrasenaHtml,
  renderRecuperacionContrasenaTexto,
} from '../Templates/recuperacion-contrasena-mail.templates';

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(private readonly mailService: MailService) {}

  async enviarRecuperacionContrasena(input: {
    correo: string;
    nombre: string;
    enlace: string;
    minutos: number;
  }): Promise<void> {
    try {
      await this.mailService.sendMail({
        to: input.correo,
        toName: input.nombre,
        subject: 'Restablece tu contraseña — Parroquia San Blas',
        htmlContent: renderRecuperacionContrasenaHtml(input),
        textContent: renderRecuperacionContrasenaTexto(input),
        tags: ['recuperacion-contrasena'],
      });
    } catch (error) {
      const detalle = error instanceof Error ? error.message : 'error de envío';
      this.logger.error(
        `No se pudo enviar el correo de recuperación a ${input.correo}: ${detalle}`,
      );
      throw error;
    }
  }
}
