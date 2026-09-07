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
  const colorFondo = esAprobado ? '#d4edda' : '#f8d7da';
  const colorTexto = esAprobado ? '#155724' : '#721c24';
  const comentario = input.comentarioAprobacion?.trim()
    ? `<div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #155724; margin-bottom: 30px;">
                                <strong style="color: #155724; font-size: 14px; text-transform: uppercase;">Comentario de la parroquia:</strong><br>
                                <p style="margin: 10px 0 0 0; font-size: 15px; font-style: italic;">"${escapeHtml(input.comentarioAprobacion.trim())}"</p>
                            </div>` // el comentario del admin solo se pinta si escribió uno al aprobar
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Playfair Display', Georgia, serif; background-color: #f4f6f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 18px 35px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color: #003366; padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Parroquia <span style="color: #d4af37; font-style: italic;">San Blas</span></h1>
                            <div style="width: 54px; height: 2px; background-color: #d4af37; margin: 15px auto;"></div>
                            <p style="color: #d4af37; margin: 0; font-size: 13px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">Gestión de Donaciones</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #333333;">
                            <p style="font-size: 16px;">Estimado/a <strong>${nombre}</strong>,</p>
                            <p style="font-size: 16px; line-height: 1.7;">Le informamos que el estado de su solicitud de donación ha sido actualizado a:</p>

                            <div style="text-align: center; margin: 30px 0;">
                                <span style="background-color: ${colorFondo}; color: ${colorTexto}; padding: 16px 32px; font-weight: 900; border-radius: 8px; font-size: 14px; letter-spacing: 1.8px; text-transform: uppercase; border: 1px solid ${colorTexto};">
                                    ${estado}
                                </span>
                            </div>

                            <div style="background-color: rgba(0, 51, 102, 0.05); padding: 20px; border-left: 4px solid rgba(212, 175, 55, 0.65); margin-bottom: 30px;">
                                <strong style="color: #003366; font-size: 14px; text-transform: uppercase;">Detalle de los insumos:</strong><br>
                                <p style="margin: 10px 0 0 0; font-size: 15px; font-style: italic;">"${detalle}"</p>
                            </div>

                            ${comentario}
                            <p style="font-size: 16px; line-height: 1.7;">Agradecemos profundamente su inmensa generosidad.</p>
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
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f6f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
                    <tr>
                        <td style="background-color: #003366; padding: 32px 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Parroquia San Blas</h1>
                            <p style="color: #d4af37; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Donaciones</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 24px; color: #333333;">
                            <p>Estimado/a <strong>${nombre}</strong>,</p>
                            <p>Le informamos que, tras la revisión de su solicitud de donación, esta ha sido <strong style="color: #721c24;">rechazada</strong>.</p>
                            <div style="background-color: #f8d7da; color: #721c24; padding: 16px; border-left: 4px solid #721c24;">
                                <p style="margin: 0; font-weight: bold;">Motivo: ${motivo}</p>${detalle}
                            </div>
                            <p>Si tiene alguna consulta, puede comunicarse con la oficina parroquial.</p>
                            <p>Gracias por su interés en apoyar a nuestra comunidad.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
