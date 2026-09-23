import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class UpdateDonacionesDto {
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
  @IsString({ message: 'El SINPE móvil debe ser texto.' })
  @IsNotEmpty({ message: 'El SINPE móvil es obligatorio.' })
  @MaxLength(40, {
    message: 'El SINPE móvil no puede superar 40 caracteres.',
  })
  @Matches(/^[\d\s-]{8,40}$/, {
    message: 'El SINPE móvil no tiene un formato válido.',
  })
  sinpe: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La cuenta bancaria debe ser texto.' })
  @IsNotEmpty({ message: 'La cuenta bancaria es obligatoria.' })
  @MaxLength(60, {
    message: 'La cuenta bancaria no puede superar 60 caracteres.',
  })
  @Matches(/^[A-Za-z]{2}[\dA-Za-z]{6,40}$/, {
    message: 'La cuenta bancaria no tiene un formato válido (IBAN).',
  })
  cuentaBancaria: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El banco debe ser texto.' })
  @IsNotEmpty({ message: 'El banco es obligatorio.' })
  @MaxLength(80, { message: 'El banco no puede superar 80 caracteres.' })
  banco: string;
}
