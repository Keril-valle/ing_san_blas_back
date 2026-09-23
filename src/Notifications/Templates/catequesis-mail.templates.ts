import { DATOS_CONTACTO_PARROQUIA } from './donacion-mail.templates';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function etiquetaNivelCatequesis(nivel: string): string {
  const valor = nivel.trim().toLowerCase();
  if (valor === 'primero') return 'Primer nivel';
  if (valor === 'sétimo' || valor === 'setimo' || valor === 'septimo') {
    return 'Sétimo nivel';
  }
  return nivel.trim();
}

export function renderInscripcionCatequesisEstadoHtml(input: {
  nombre: string;
  nombreCatequizando: string;
  centroCatequesis: string;
  nivel: string;
  estado: string;
  observacion?: string;
}): string {
  const nombre = escapeHtml(input.nombre);
  const catequizando = escapeHtml(input.nombreCatequizando);
  const centro = escapeHtml(input.centroCatequesis);
  const nivel = escapeHtml(etiquetaNivelCatequesis(input.nivel));
  const estado = escapeHtml(input.estado);
  const esAprobada = input.estado.toLowerCase().startsWith('aprob');
  const colorFondo = esAprobada ? '#e8f0e8' : '#f9e8e8';
  const colorTexto = esAprobada ? '#2d5a2d' : '#7a1f1f';
  const observacion = input.observacion?.trim()
    ? `<p style="margin: 10px 0 0 0; font-size: 15px;">"${escapeHtml(input.observacion.trim())}"</p>`
    : '';
  const bloqueObservacion = observacion
    ? `<div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
                                <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${esAprobada ? 'Comentario de la parroquia' : 'Motivo del rechazo'}:</strong>
                                ${observacion}
                            </div>`
    : '';
  const cierre = esAprobada
    ? `<p style="font-size: 15px; line-height: 1.7;">Para cualquier consulta puede comunicarse con la oficina parroquial al teléfono <strong>${DATOS_CONTACTO_PARROQUIA.telefono}</strong>.</p>`
    : `<p style="font-size: 15px; line-height: 1.7;">Si tiene alguna consulta sobre este resultado, puede comunicarse con la oficina parroquial al teléfono <strong>${DATOS_CONTACTO_PARROQUIA.telefono}</strong>.</p>`;

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
                            <p style="font-size: 15px; line-height: 1.7;">Le informamos que la solicitud de inscripción a catequesis de <strong>${catequizando}</strong> fue ${esAprobada ? 'aprobada' : 'rechazada'}.</p>

                            <div style="text-align: center; margin: 24px 0;">
                                <span style="display: inline-block; background-color: ${colorFondo}; color: ${colorTexto}; padding: 10px 28px; font-weight: 700; border-radius: 4px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${colorTexto};">
                                    ${estado}
                                </span>
                            </div>

                            <div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
                                <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datos de la inscripción:</strong>
                                <p style="margin: 10px 0 0 0; font-size: 15px;"><strong>Catequizando:</strong> ${catequizando}</p>
                                <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Nivel:</strong> ${nivel}</p>
                                <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Centro:</strong> ${centro}</p>
                            </div>

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
