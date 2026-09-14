import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

const TEXTO_SIN_REPETICIONES_ACCIDENTALES = /^(?!.*(.)\1{3,}).*$/;

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido.' })
  @MaxLength(50, { message: 'El título no puede superar las 50 letras.' })
  @Matches(TEXTO_SIN_REPETICIONES_ACCIDENTALES, {
    message: 'El título no puede contener un carácter repetido tantas veces.',
  })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida.' })
  @MaxLength(250, {
    message: 'La descripción no puede superar las 250 letras.',
  })
  @Matches(TEXTO_SIN_REPETICIONES_ACCIDENTALES, {
    message:
      'La descripción no puede contener un carácter repetido tantas veces.',
  })
  descripcion: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de inicio es requerida.' })
  fechaInicio: string;

  @IsOptional()
  @IsString()
  fechaFin?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'El lugar es requerido.' })
  @MaxLength(50, { message: 'El lugar no puede superar las 50 letras.' })
  @Matches(TEXTO_SIN_REPETICIONES_ACCIDENTALES, {
    message: 'El lugar no puede contener un carácter repetido tantas veces.',
  })
  lugar: string;

  @IsOptional()
  @IsString()
  @MaxLength(8, { message: 'La hora no es válida.' })
  hora?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La URL de la imagen es demasiado larga.' })
  imagenUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
