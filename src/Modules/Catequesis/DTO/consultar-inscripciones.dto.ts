import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ESTADOS_INSCRIPCION_VALIDOS,
  MENSAJE_ESTADO_INVALIDO,
  MENSAJE_NIVEL_INVALIDO,
  NIVELES_INSCRIPCION_VALIDOS,
  normalizarEstadoInscripcion,
  normalizarNivelInscripcion,
} from '../../../Common/Utils/inscripcion-catequesis-validaciones';

const recortar = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  const recortado = value.trim().replace(/\s+/g, ' ');
  return recortado === '' ? undefined : recortado;
};

export class ConsultarInscripcionesDto {
  @IsOptional()
  @Transform(({ value }) => {
    const texto = recortar({ value });
    if (typeof texto !== 'string') {
      return texto;
    }
    return normalizarEstadoInscripcion(texto) ?? texto;
  })
  @IsString()
  @IsIn([...ESTADOS_INSCRIPCION_VALIDOS], {
    message: MENSAJE_ESTADO_INVALIDO,
  })
  estado?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120, {
    message: 'El nombre no puede superar 120 caracteres.',
  })
  nombre?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120, {
    message: 'El encargado no puede superar 120 caracteres.',
  })
  encargado?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120, {
    message: 'La búsqueda no puede superar 120 caracteres.',
  })
  q?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const texto = recortar({ value });
    if (typeof texto !== 'string') {
      return texto;
    }
    return normalizarNivelInscripcion(texto) ?? texto;
  })
  @IsString()
  @IsIn([...NIVELES_INSCRIPCION_VALIDOS], {
    message: MENSAJE_NIVEL_INVALIDO,
  })
  nivel?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120, {
    message: 'La filial no puede superar 120 caracteres.',
  })
  filial?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor que 0.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser mayor que 0.' })
  @Max(100, { message: 'El límite no puede superar 100 registros.' })
  limit?: number;
}
