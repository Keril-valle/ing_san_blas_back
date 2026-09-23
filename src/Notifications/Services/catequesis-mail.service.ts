import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { DATOS_CONTACTO_PARROQUIA } from '../Templates/donacion-mail.templates';
import {
  etiquetaNivelCatequesis,
  renderInscripcionCatequesisEstadoHtml,
} from '../Templates/catequesis-mail.templates';

export type AvisoInscripcionCatequesis = {
  id: number;
  correo: string | null;
  nombreDestinatario: string;
  nombreCatequizando: string;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  observacion?: string | null;
};

@Injectable()
export class CatequesisMailService {
  private readonly logger = new Logger(CatequesisMailService.name);

  constructor(private readonly mailService: MailService) {}

  async notificarEstado(aviso: AvisoInscripcionCatequesis): Promise<void> {
    const estado = aviso.estado.toLowerCase();
    const esAprobada = estado.startsWith('aprob');
    const esRechazada = estado.startsWith('rechaz');
    if (!esAprobada && !esRechazada) {
      return;
    }

    if (!aviso.correo?.trim()) {
      this.logger.warn(
        `Inscripción ${aviso.id} sin correo, no se avisa el cambio a ${aviso.estado}`,
      );
      return;
    }

    const resultado = esAprobada ? 'aprobada' : 'rechazada';
    const observacion = aviso.observacion?.trim() || undefined;
    const nivel = etiquetaNivelCatequesis(aviso.nivelAInscribirse);

    try {
      await this.mailService.sendMail({
        to: aviso.correo.trim(),
        toName: aviso.nombreDestinatario || undefined,
        subject: `Tu solicitud de inscripción a catequesis fue ${resultado} - Parroquia San Blas`,
        htmlContent: renderInscripcionCatequesisEstadoHtml({
          nombre: aviso.nombreDestinatario || 'encargado',
          nombreCatequizando: aviso.nombreCatequizando,
          centroCatequesis: aviso.centroCatequesis,
          nivel: aviso.nivelAInscribirse,
          estado: aviso.estado,
          observacion,
        }),
        textContent: `Estimado/a ${aviso.nombreDestinatario || 'encargado'}, la solicitud de inscripción a catequesis de ${aviso.nombreCatequizando} fue ${resultado}. Nivel: ${nivel}. Centro: ${aviso.centroCatequesis}.${observacion ? ` ${esAprobada ? 'Comentario' : 'Motivo'}: ${observacion}.` : ''} Consultas: oficina parroquial al ${DATOS_CONTACTO_PARROQUIA.telefono}.`,
        tags: ['catequesis', resultado],
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo mandar el correo de ${resultado} de la inscripción ${aviso.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
