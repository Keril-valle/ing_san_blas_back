import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

function recortarLineas({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => typeof item === 'string' && item.length > 0);
}

export class UpdateContactoDto {
  @Transform(transformarTexto)
  @IsString({ message: 'La etiqueta debe ser texto.' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria.' })
  @MaxLength(40, { message: 'La etiqueta no puede superar 40 caracteres.' })
  eyebrow: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La introducción debe ser texto.' })
  @IsNotEmpty({ message: 'La introducción es obligatoria.' })
  @MaxLength(300, {
    message: 'La introducción no puede superar 300 caracteres.',
  })
  intro: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El teléfono debe ser texto.' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @MaxLength(40, { message: 'El teléfono no puede superar 40 caracteres.' })
  @Matches(/^[\d+\s()-]{7,40}$/, {
    message: 'El teléfono no tiene un formato válido.',
  })
  telefono: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El correo debe ser texto.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido.' })
  @MaxLength(80, { message: 'El correo no puede superar 80 caracteres.' })
  correo: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La ubicación debe ser texto.' })
  @IsNotEmpty({ message: 'La ubicación es obligatoria.' })
  @MaxLength(120, { message: 'La ubicación no puede superar 120 caracteres.' })
  ubicacion: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Los horarios de atención son obligatorios.' })
  @ArrayMinSize(1, { message: 'Incluya al menos un horario de atención.' })
  @IsString({ each: true, message: 'Cada horario debe ser texto.' })
  @MaxLength(200, {
    each: true,
    message: 'Cada horario no puede superar 200 caracteres.',
  })
  horariosAtencion: string[];

  @IsOptional()
  @Transform(transformarTexto)
  @IsString({ message: 'La URL del mapa debe ser texto.' })
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL del mapa no es válida.' },
  )
  mapaUrl?: string;

  @IsOptional()
  @Transform(transformarTexto)
  @IsString({ message: 'La URL de Facebook debe ser texto.' })
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de Facebook no es válida.' },
  )
  facebook?: string;
}
