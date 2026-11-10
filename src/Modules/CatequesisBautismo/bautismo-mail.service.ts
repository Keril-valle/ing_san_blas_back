import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../Notifications/Services/mail.service';
import {
  renderBautismoInscripcionHtml,
  type TipoAvisoBautismo,
} from './bautismo-mail.templates';

export type AvisoBautismo = {
  id: number;
  correo: string | null;
  nombre: string;
  estado: string;
  observacion?: string | null;
  fechaInicioCatequesis?: string | null;
  fechaFinalizacionCatequesis?: string | null;
  responsableCertifica?: string | null;
};

@Injectable()
export class BautismoMailService {
  private readonly logger = new Logger(BautismoMailService.name);

  constructor(private readonly mailService: MailService) {}

  // Aviso inmediato al recibir la inscripción.
  async notificarInscripcion(aviso: AvisoBautismo): Promise<void> {
    await this.enviar(aviso, 'recibida');
  }

  // Solo avisa cuando el estado final es Aprobada o Rechazada.
  async notificarEstado(aviso: AvisoBautismo): Promise<void> {
    const estado = aviso.estado.toLowerCase();
    if (estado.startsWith('aprob')) await this.enviar(aviso, 'aprobada');
    else if (estado.startsWith('rechaz')) await this.enviar(aviso, 'rechazada');
  }

  private async enviar(
    aviso: AvisoBautismo,
    tipo: TipoAvisoBautismo,
  ): Promise<void> {
    const correo = aviso.correo?.trim();
    if (!correo) {
      this.logger.warn(
        `Inscripción ${aviso.id} sin correo, no se avisa el estado ${aviso.estado}`,
      );
      return;
    }

    const asunto = {
      recibida:
        'Recibimos tu solicitud de Catequesis para el Bautismo - Parroquia San Blas',
      aprobada:
        'Tu Catequesis para el Bautismo fue aprobada - Parroquia San Blas',
      rechazada:
        'Tu solicitud de Catequesis para el Bautismo fue rechazada - Parroquia San Blas',
    }[tipo];

    const texto = {
      recibida: `Estimado/a ${aviso.nombre}, recibimos su solicitud de inscripción a la Catequesis para el Bautismo. Quedó pendiente hasta que la parroquia certifique que completó el curso.`,
      aprobada: `Estimado/a ${aviso.nombre}, su Catequesis para el Bautismo fue aprobada. Ya puede continuar con el bautismo.`,
      rechazada: `Estimado/a ${aviso.nombre}, su solicitud de Catequesis para el Bautismo fue rechazada.${aviso.observacion?.trim() ? ` Motivo: ${aviso.observacion.trim()}.` : ''}`,
    }[tipo];

    try {
      await this.mailService.sendMail({
        to: correo,
        toName: aviso.nombre || undefined,
        subject: asunto,
        htmlContent: renderBautismoInscripcionHtml({
          nombre: aviso.nombre || 'interesado',
          estado: aviso.estado,
          tipo,
          observacion: aviso.observacion?.trim() || undefined,
          fechaInicioCatequesis: aviso.fechaInicioCatequesis,
          fechaFinalizacionCatequesis: aviso.fechaFinalizacionCatequesis,
          responsableCertifica: aviso.responsableCertifica,
        }),
        textContent: `${texto} Consultas: oficina parroquial.`,
        tags: ['bautismo', tipo],
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo mandar el correo ${tipo} de la inscripción ${aviso.id}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
}
