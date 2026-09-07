import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import {
  renderDonacionEstadoHtml,
  renderDonacionRechazadaHtml,
} from '../Templates/donacion-mail.templates';
import type { Donacion } from '../../Modules/Donaciones/Entities/donacion.entity';

@Injectable()
export class DonacionMailService {
  private readonly logger = new Logger(DonacionMailService.name);

  constructor(private readonly mailService: MailService) {}

  // Avisa al donante que su solicitud cambió de estado (vale para aprobado y rechazado del endpoint genérico)
  async notificarEstado(donacion: Donacion): Promise<void> {
    if (!donacion.correo) {
      this.logger.warn(
        `Donación ${donacion.id} sin correo, no se avisa el cambio a ${donacion.estado}`,
      );
      return;
    }

    try {
      const comentario = donacion.detalleAprobacion?.trim() || undefined; // lo que el admin escribió al aprobar, si es que escribió algo
      await this.mailService.sendMail({
        to: donacion.correo,
        toName: donacion.anonimo ? undefined : donacion.nombre, // a los anónimos no les usamos el nombre ni en el correo
        subject: `Tu donación fue ${donacion.estado === 'Aprobado' ? 'aprobada' : 'rechazada'} - Parroquia San Blas`,
        htmlContent: renderDonacionEstadoHtml({
          nombre: donacion.anonimo ? 'donante anónimo' : donacion.nombre,
          estado: donacion.estado,
          detalle: donacion.detalle,
          comentarioAprobacion: comentario,
        }),
        textContent: `Estimado/a ${donacion.nombre}, su solicitud de donación fue ${donacion.estado}. Detalle: ${donacion.detalle}${comentario ? ` Comentario de la parroquia: ${comentario}` : ''}`,
        tags: ['donaciones', 'estado'],
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo mandar el correo de estado de la donación ${donacion.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // Avisa al donante que su solicitud fue rechazada, con motivo y detalle si hay
  async notificarRechazo(
    donacion: Donacion,
    motivo: string,
    detalle?: string,
  ): Promise<void> {
    if (!donacion.correo) {
      this.logger.warn(
        `Donación ${donacion.id} sin correo, no se avisa el rechazo`,
      );
      return;
    }

    try {
      await this.mailService.sendMail({
        to: donacion.correo,
        toName: donacion.anonimo ? undefined : donacion.nombre, // igual que arriba, el anonimato se respeta siempre
        subject: 'Tu solicitud de donación fue rechazada - Parroquia San Blas',
        htmlContent: renderDonacionRechazadaHtml({
          nombre: donacion.anonimo ? 'donante anónimo' : donacion.nombre,
          motivo,
          detalle,
        }),
        textContent: `Estimado/a ${donacion.nombre}, su solicitud de donación fue rechazada. Motivo: ${motivo}${detalle ? ` Detalle: ${detalle}` : ''}`,
        tags: ['donaciones', 'rechazo'],
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo mandar el correo de rechazo de la donación ${donacion.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
