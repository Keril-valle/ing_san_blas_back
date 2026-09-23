function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderRecuperacionContrasenaHtml(input: {
  nombre: string;
  enlace: string;
  minutos: number;
}): string {
  const nombre = escapeHtml(input.nombre || 'usuario');
  const enlace = escapeHtml(input.enlace);

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:#003366;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:700;">
          Parroquia San Blas
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;">Hola ${nombre},</p>
          <p style="margin:0 0 16px;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            El enlace vence en ${input.minutos} minutos y solo puede usarse una vez.
          </p>
          <p style="margin:0 0 20px;">
            <a href="${enlace}" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
              Restablecer contraseña
            </a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
            Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual sigue igual.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderRecuperacionContrasenaTexto(input: {
  nombre: string;
  enlace: string;
  minutos: number;
}): string {
  const nombre = input.nombre.trim() || 'usuario';
  return [
    `Hola ${nombre},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
    `El enlace vence en ${input.minutos} minutos y solo puede usarse una vez:`,
    input.enlace,
    '',
    'Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual sigue igual.',
  ].join('\n');
}
