import { BadRequestException, HttpException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { esMensajeTecnico } from './mensajes-error';

/**
 * Los servicios de negocio lanzan errores propios (fallos de reglas) que los
 * controladores responden como 400. Lo que ya es una respuesta HTTP o un fallo
 * de base de datos conserva su estado original para que el filtro global lo
 * traduzca (503, mensajes amigables) en vez de devolver un 400 engañoso.
 *
 * Un Error plano de JavaScript (un TypeError, por ejemplo) NO se muestra al
 * usuario: se responde con el mensaje por defecto en español.
 */
export function rethrowComoBadRequest(
  error: unknown,
  mensajePorDefecto = 'No se pudo procesar la solicitud.',
): never {
  if (error instanceof HttpException || error instanceof QueryFailedError) {
    throw error;
  }

  const mensaje =
    error instanceof Error &&
    error.message.trim().length > 0 &&
    !esMensajeTecnico(error.message)
      ? error.message
      : mensajePorDefecto;

  throw new BadRequestException({ mensaje });
}
