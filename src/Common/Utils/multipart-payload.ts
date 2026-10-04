import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { mapValidationErrors } from '../validation-errors';

export interface MensajesPayload {
  vacio?: string;
  invalido?: string;
}

/**
 * Convierte el contenido del campo `Payload` (JSON en texto) en un objeto.
 * Compartido por todos los endpoints que reciben archivo + JSON.
 */
export function parsearPayloadJson<T>(
  payload: string | undefined,
  mensajes: MensajesPayload = {},
): T {
  if (!payload?.trim()) {
    throw new BadRequestException({
      mensaje: mensajes.vacio ?? 'Los datos son obligatorios.',
    });
  }

  try {
    return JSON.parse(payload) as T;
  } catch {
    throw new BadRequestException({
      mensaje: mensajes.invalido ?? 'El formato de los datos no es válido.',
    });
  }
}

/**
 * Aplica al payload de un multipart el mismo criterio que el ValidationPipe
 * global: transforma, valida y deja solo los campos del DTO (whitelist). Sin
 * esto, los endpoints con archivo leían el JSON a mano y se saltaban la
 * validación, así que campos desconocidos llegaban tal cual a la entidad.
 */
export async function validarPayloadMultipart<T extends object>(
  datos: unknown,
  clase: new () => T,
): Promise<T> {
  const dto = plainToInstance(clase, datos as object, {
    enableImplicitConversion: true,
  });

  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errores.length > 0) {
    throw new BadRequestException(mapValidationErrors(errores));
  }

  return dto;
}

/**
 * Los endpoints que reciben archivo + JSON traen el JSON dentro del campo
 * `Payload` de un `multipart/form-data`. Centraliza su lectura y su validación
 * para no repetir el mismo bloque en cada controlador.
 */
export async function leerPayloadMultipart<T extends object>(
  req: Request,
  clase: new () => T,
  mensajes: MensajesPayload = {},
): Promise<T> {
  const payload = (req.body as { Payload?: string } | undefined)?.Payload;
  const datos = parsearPayloadJson<unknown>(payload, mensajes);
  return validarPayloadMultipart(datos, clase);
}
