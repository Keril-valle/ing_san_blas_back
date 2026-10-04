import { BadRequestException } from '@nestjs/common';

export const MENSAJE_FECHA_FORMATO_INVALIDA =
  'El formato de fecha no es válido, usá YYYY-MM-DD';
export const MENSAJE_FECHA_RANGO_INVERTIDO =
  'La fecha de inicio no puede ser mayor que la fecha de fin';

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida el rango de fechas `desde`/`hasta` (formato YYYY-MM-DD) que usan los
 * endpoints de historial. Si alguna es opcional y no viene, se omite.
 */
export function validarRangoFechas(desde?: string, hasta?: string): void {
  for (const fecha of [desde, hasta]) {
    if (
      fecha !== undefined &&
      (!REGEX_FECHA.test(fecha) || Number.isNaN(new Date(fecha).getTime()))
    ) {
      throw new BadRequestException({
        mensaje: MENSAJE_FECHA_FORMATO_INVALIDA,
      });
    }
  }

  if (desde && hasta && new Date(desde).getTime() > new Date(hasta).getTime()) {
    throw new BadRequestException({ mensaje: MENSAJE_FECHA_RANGO_INVERTIDO });
  }
}
