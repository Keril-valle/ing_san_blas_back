import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido.' })
  @MaxLength(50, { message: 'El título no puede superar las 50 letras.' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida.' })
  @MaxLength(250, {
    message: 'La descripción no puede superar las 250 letras.',
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
  lugar: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
