import {
  DATOS_CONTACTO_PARROQUIA,
  renderBloqueHorariosAtencionHtml,
} from '../../Notifications/Templates/donacion-mail.templates';

export type TipoAvisoBautismo = 'recibida' | 'aprobada' | 'rechazada';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const formatearFecha = (valor?: string | null): string => {
  if (!valor) return '—';
  const soloDia = valor.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(soloDia)) {
    const [anio, mes, dia] = soloDia.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  return valor;
};

export function renderBautismoInscripcionHtml(input: {
  nombre: string;
  estado: string;
  tipo: TipoAvisoBautismo;
  observacion?: string;
  fechaInicioCatequesis?: string | null;
  fechaFinalizacionCatequesis?: string | null;
  responsableCertifica?: string | null;
}): string {
  const nombre = escapeHtml(input.nombre);
  const estado = escapeHtml(input.estado);
  const esAprobada = input.tipo === 'aprobada';
  const esRechazada = input.tipo === 'rechazada';
  const colorFondo = esAprobada ? '#e8f0e8' : esRechazada ? '#f9e8e8' : '#eef2f8';
  const colorTexto = esAprobada ? '#2d5a2d' : esRechazada ? '#7a1f1f' : '#1f3350';

  const introduccion = esAprobada
    ? 'Le informamos que su Catequesis para el Bautismo fue <strong>aprobada</strong>. Ya puede continuar con el bautismo.'
    : esRechazada
      ? 'Le informamos que su solicitud de Catequesis para el Bautismo fue <strong>rechazada</strong>.'
      : 'Recibimos su solicitud de inscripción a la Catequesis para el Bautismo. Quedó <strong>pendiente</strong> hasta que la parroquia certifique que completó el curso.';

  const detalleAprobada =
    esAprobada && (input.fechaInicioCatequesis || input.fechaFinalizacionCatequesis)
      ? `<div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
            <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datos de la certificación:</strong>
            <p style="margin: 10px 0 0 0; font-size: 15px;"><strong>Del:</strong> ${formatearFecha(input.fechaInicioCatequesis)}</p>
            <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Al:</strong> ${formatearFecha(input.fechaFinalizacionCatequesis)}</p>
            <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Certifica:</strong> ${escapeHtml(input.responsableCertifica?.trim() || '—')}</p>
          </div>`
      : '';

  const bloqueObservacion =
    esRechazada && input.observacion?.trim()
      ? `<div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
            <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Motivo del rechazo:</strong>
            <p style="margin: 10px 0 0 0; font-size: 15px;">"${escapeHtml(input.observacion.trim())}"</p>
          </div>`
      : '';

  const cierre = esAprobada
    ? renderBloqueHorariosAtencionHtml()
    : `<p style="font-size: 15px; line-height: 1.7;">Si tiene alguna consulta, puede comunicarse con la oficina parroquial al teléfono <strong>${DATOS_CONTACTO_PARROQUIA.telefono}</strong>.</p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #e9ecef;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 12px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #d0d0d0;">
                    <tr>
                        <td style="background-color: #1f3350; padding: 28px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">Parroquia San Blas</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 30px; font-family: Arial, Helvetica, sans-serif; color: #333333;">
                            <p style="font-size: 15px;">Estimado/a <strong>${nombre}</strong>:</p>
                            <p style="font-size: 15px; line-height: 1.7;">${introduccion}</p>

                            <div style="text-align: center; margin: 24px 0;">
                                <span style="display: inline-block; background-color: ${colorFondo}; color: ${colorTexto}; padding: 10px 28px; font-weight: 700; border-radius: 4px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${colorTexto};">
                                    ${estado}
                                </span>
                            </div>

                            ${detalleAprobada}
                            ${bloqueObservacion}
                            ${cierre}
                            <p style="font-size: 15px; line-height: 1.7; margin-bottom: 0;">Atentamente,<br><strong>Parroquia San Blas</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 16px 30px; border-top: 1px solid #dee2e6; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; font-family: Arial, Helvetica, sans-serif;">Este es un mensaje automático. Por favor, no responda a este correo.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
