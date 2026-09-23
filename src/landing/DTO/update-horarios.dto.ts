import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
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

export class HorarioFilaDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El día debe ser texto.' })
  @IsNotEmpty({ message: 'El día es obligatorio.' })
  @MaxLength(80, {
    message: 'El día no puede superar 80 caracteres.',
  })
  dia: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Las horas son obligatorias.' })
  @ArrayMinSize(1, { message: 'Cada fila debe incluir al menos una hora.' })
  @ArrayMaxSize(10, { message: 'Cada fila puede incluir máximo 10 horas.' })
  @IsString({ each: true, message: 'Cada hora debe ser texto.' })
  @MaxLength(120, {
    each: true,
    message: 'Cada hora no puede superar 120 caracteres.',
  })
  horas: string[];
}

export class HorarioBloqueDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título del bloque debe ser texto.' })
  @IsNotEmpty({ message: 'El título del bloque es obligatorio.' })
  @MaxLength(80, {
    message: 'El título del bloque no puede superar 80 caracteres.',
  })
  titulo: string;

  @IsArray({ message: 'Las filas del bloque son obligatorias.' })
  @ArrayMinSize(1, { message: 'Cada bloque debe incluir al menos una fila.' })
  @ArrayMaxSize(10, { message: 'Cada bloque puede incluir máximo 10 filas.' })
  @ValidateNested({ each: true })
  @Type(() => HorarioFilaDto)
  filas: HorarioFilaDto[];
}

export class UpdateHorariosDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El subtítulo debe ser texto.' })
  @IsNotEmpty({ message: 'El subtítulo es obligatorio.' })
  @MaxLength(80, { message: 'El subtítulo no puede superar 80 caracteres.' })
  subtitle: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título destacado debe ser texto.' })
  @IsNotEmpty({ message: 'El título destacado es obligatorio.' })
  @MaxLength(80, {
    message: 'El título destacado no puede superar 80 caracteres.',
  })
  titleHighlight: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La introducción debe ser texto.' })
  @IsNotEmpty({ message: 'La introducción es obligatoria.' })
  @MaxLength(220, {
    message: 'La introducción no puede superar 220 caracteres.',
  })
  intro: string;

  @IsArray({ message: 'Los bloques de horarios son obligatorios.' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un bloque de horarios.' })
  @ArrayMaxSize(4, { message: 'Puede incluir máximo 4 bloques de horarios.' })
  @ValidateNested({ each: true })
  @Type(() => HorarioBloqueDto)
  bloques: HorarioBloqueDto[];

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen no es válida.' },
  )
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  eliminarImagen?: boolean;
}
