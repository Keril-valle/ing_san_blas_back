import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDonacionDto {
  @IsBoolean()
  anonimo: boolean;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsEmail({}, { message: 'Formato de correo inválido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  correo: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  @IsNotEmpty({ message: 'El detalle de la donación es obligatorio.' })
  @MaxLength(300, {
    message: 'El detalle no puede superar los 300 caracteres.',
  })
  detalle: string;
}
