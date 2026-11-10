import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ResultadoRecaptcha {
  success?: boolean;
  hostname?: string;
  challenge_ts?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  // La clave se lee solo en el servidor; nunca se devuelve al cliente ni se registra.
  constructor(private readonly config: ConfigService) {}

  // Verifica con Google antes de permitir cualquier guardado o subida de archivos.
  async verificar(token: unknown): Promise<void> {
    if (typeof token !== 'string' || !token.trim() || token.length > 4096) {
      throw new BadRequestException('Completá el reCAPTCHA antes de enviar.');
    }

    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY')?.trim();
    if (!secret) {
      throw new ServiceUnavailableException(
        'La verificación de seguridad no está disponible. Intente más tarde.',
      ); // sin configuración no se permite pasar como si el captcha fuera válido
    }

    let resultado: ResultadoRecaptcha;
    try {
      const response = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: token.trim() }),
          signal: AbortSignal.timeout(8000),
          redirect: 'error', // no reenviamos la clave a una ubicación redirigida
        },
      );
      if (!response.ok) throw new Error('Proveedor no disponible');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Respuesta inválida del proveedor');
      }
      resultado = data as ResultadoRecaptcha;
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo verificar el reCAPTCHA. Intente nuevamente.',
      ); // no exponemos errores de transporte que puedan incluir datos sensibles
    }

    const errores = resultado['error-codes'];
    if (
      Array.isArray(errores) &&
      errores.some((codigo) =>
        ['missing-input-secret', 'invalid-input-secret'].includes(codigo),
      )
    ) {
      throw new ServiceUnavailableException(
        'La verificación de seguridad no está disponible. Intente más tarde.',
      );
    }

    if (
      resultado.success !== true ||
      typeof resultado.hostname !== 'string' ||
      !this.hostnamesPermitidos().includes(resultado.hostname.toLowerCase())
    ) {
      throw new BadRequestException(
        'El reCAPTCHA no es válido o expiró. Resolvelo nuevamente.',
      ); // Google controla vencimiento y reutilización; no cacheamos sus respuestas
    }
  }

  // Usa una lista del entorno o el dominio del frontend, nunca el Origin enviado por el usuario.
  private hostnamesPermitidos(): string[] {
    const configurados = this.config
      .get<string>('RECAPTCHA_ALLOWED_HOSTNAMES')
      ?.split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
    if (configurados?.length) return configurados;

    const frontend = this.config.get<string>('FRONTEND_URL')?.trim();
    if (frontend) {
      try {
        return [new URL(frontend).hostname.toLowerCase()];
      } catch {
        throw new ServiceUnavailableException(
          'La verificación de seguridad no está disponible. Intente más tarde.',
        );
      }
    }
    return ['parroquiasanblas.org'];
  }
}
