const TELEFONO_PARROQUIA = '2685-3540';
const LUGAR_PARROQUIA = 'Oficina parroquial, frente a la juguetería El Jade';

export const DATOS_CONTACTO_PARROQUIA = {
  telefono: TELEFONO_PARROQUIA,
  lugar: LUGAR_PARROQUIA,
};

// Plantillas de correo de donaciones (mismo diseño que los HTML sueltos de /Template, pero en TS para que viajen en el build de Railway sin pelear con assets)
function escapeHtml(value: string): string {
  return value // escapamos lo que escribe el usuario para que nadie meta HTML raro en el correo
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Arma el correo genérico de cambio de estado (lo usa el endpoint PATCH /Donacion/:id/estado)
export function renderDonacionEstadoHtml(input: {
  nombre: string;
  estado: string;
  detalle: string;
  comentarioAprobacion?: string;
}): string {
  const nombre = escapeHtml(input.nombre);
  const estado = escapeHtml(input.estado);
  const detalle = escapeHtml(input.detalle);
  const esAprobado = input.estado.toLowerCase().startsWith('aprob'); // verde si aprobó, rojo si no (así se entiende de un vistazo)
  const colorFondo = esAprobado ? '#e8f0e8' : '#f9e8e8';
  const colorTexto = esAprobado ? '#2d5a2d' : '#7a1f1f';
  const comentarioAdmin = input.comentarioAprobacion?.trim()
    ? `<p style="margin: 10px 0 12px 0; font-size: 15px;">"${escapeHtml(input.comentarioAprobacion.trim())}"</p>` // el comentario del admin solo se pinta si escribió uno al aprobar
    : '';
  // Lugar de entrega va dentro del comentario de la parroquia para no andar con dos bloques separados (así queda más formal)
  const bloqueParroquia = esAprobado
    ? `<div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
                                <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Comentario de la parroquia:</strong>
                                ${comentarioAdmin}
                                <p style="margin: 10px 0 0 0; font-size: 15px;"><strong>Lugar de entrega:</strong> ${escapeHtml(LUGAR_PARROQUIA)}</p>
                                <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Teléfono:</strong> ${TELEFONO_PARROQUIA}</p>
                            </div>`
    : comentarioAdmin
      ? `<div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
                                <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Comentario de la parroquia:</strong>
                                ${comentarioAdmin}
                            </div>`
      : '';

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
                            <p style="font-size: 15px; line-height: 1.7;">Le informamos que el estado de su solicitud de donación ha sido actualizado a:</p>

                            <div style="text-align: center; margin: 24px 0;">
                                <span style="display: inline-block; background-color: ${colorFondo}; color: ${colorTexto}; padding: 10px 28px; font-weight: 700; border-radius: 4px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${colorTexto};">
                                    ${estado}
                                </span>
                            </div>

                            <div style="background-color: #f8f9fa; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #1f3350; margin-bottom: 24px;">
                                <strong style="color: #1f3350; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Detalle de la solicitud:</strong>
                                <p style="margin: 10px 0 0 0; font-size: 15px;">"${detalle}"</p>
                            </div>

                            ${bloqueParroquia}
                            ${
                              esAprobado
                                ? ''
                                : `<p style="font-size: 15px; line-height: 1.7;">Si tiene alguna consulta, puede comunicarse con la oficina parroquial al teléfono <strong>${TELEFONO_PARROQUIA}</strong>.</p>`
                            }
                            <p style="font-size: 15px; line-height: 1.7;">Agradecemos sinceramente su generosidad y apoyo a nuestra comunidad.</p>
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

// Arma el correo de rechazo con motivo (lo usa el endpoint PATCH /Donacion/:id/rechazar)
export function renderDonacionRechazadaHtml(input: {
  nombre: string;
  motivo: string;
  detalle?: string;
}): string {
  const nombre = escapeHtml(input.nombre);
  const motivo = escapeHtml(input.motivo);
  const detalle = input.detalle?.trim()
    ? `<p style="margin: 12px 0 0 0;">${escapeHtml(input.detalle.trim())}</p>` // el detalle es opcional, solo se pinta si viene
    : '';

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
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Parroquia San Blas</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 30px; color: #333333;">
                            <p style="font-size: 15px;">Estimado/a <strong>${nombre}</strong>:</p>
                            <p style="font-size: 15px; line-height: 1.7;">Le informamos que, tras la revisión correspondiente, su solicitud de donación ha sido <strong style="color: #7a1f1f;">rechazada</strong>.</p>
                            <div style="background-color: #f8f9fa; color: #333333; padding: 20px 22px; border: 1px solid #dee2e6; border-left: 3px solid #7a1f1f;">
                                <p style="margin: 0; font-size: 15px;"><strong>Motivo:</strong> ${motivo}</p>${detalle}
                            </div>
                            <p style="font-size: 15px; line-height: 1.7;">Si tiene alguna consulta, puede comunicarse con la oficina parroquial al teléfono <strong>${TELEFONO_PARROQUIA}</strong>.</p>
                            <p style="font-size: 15px; line-height: 1.7;">Agradecemos su interés en apoyar a nuestra comunidad.</p>
                            <p style="font-size: 15px; line-height: 1.7; margin-bottom: 0;">Atentamente,<br><strong>Parroquia San Blas</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 16px 30px; border-top: 1px solid #dee2e6; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">Este es un mensaje automático. Por favor, no responda a este correo.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
