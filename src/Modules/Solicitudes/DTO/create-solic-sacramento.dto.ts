import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  Length,
  Matches,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

const normalizarTexto = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.normalize('NFC').trim().replace(/\s+/g, ' ')
    : value;

const nombreValido = /^[\p{L}]+(?:[ '\u002D][\p{L}]+)*$/u;
const textoSinEtiquetas = /^(?!.*[<>])[\p{L}\p{N}\s.,;:'"!?()\-_/]+$/u;

export class CreateSolicSacramentoDto {
  @Transform(normalizarTexto)
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(nombreValido, {
    message: 'PrimerNombre solo puede contener letras, espacios o guiones',
  })
  PrimerNombre: string;

  @IsOptional()
  @Transform(normalizarTexto)
  @IsString()
  @Length(1, 50)
  @Matches(nombreValido, {
    message: 'SegundoNombre solo puede contener letras, espacios o guiones',
  })
  SegundoNombre?: string;

  @Transform(normalizarTexto)
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(nombreValido, {
    message: 'PrimerApellido solo puede contener letras, espacios o guiones',
  })
  PrimerApellido: string;

  @Transform(normalizarTexto)
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(nombreValido, {
    message: 'SegundoApellido solo puede contener letras, espacios o guiones',
  })
  SegundoApellido: string;

  @IsInt()
  @Min(100000000)
  @Max(999999999)
  Cedula: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(120)
  Correo: string;

  @IsInt()
  @Min(10000000)
  @Max(99999999)
  Telefono: number;

  @Transform(normalizarTexto)
  @IsString()
  @IsNotEmpty()
  @Length(1, 250)
  @Matches(textoSinEtiquetas, {
    message: 'Motivo contiene caracteres no permitidos',
  })
  Motivo: string;
}

export class CreateSolicSacramentoWithFileDto {
  @IsString()
  @IsNotEmpty()
  Payload: string;
}
