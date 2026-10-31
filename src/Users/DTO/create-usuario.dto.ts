import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

/**
 * Alta por panel: el usuario define su contraseña al activar la cuenta.
 * No se piden password/confirmPassword aquí.
 */
export class CreateUsuarioDto {
  @Transform(transformarTexto)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @Transform(transformarTexto)
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsArray({ message: 'Los roles deben venir como una lista.' })
  @IsString({ each: true, message: 'Cada rol debe ser texto.' })
  roles?: string[];

  @Transform(transformarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^[1-9]\d{3}-\d{4}$/, {
    message:
      'El teléfono debe tener el formato 8888-8888 y no comenzar con cero',
  })
  telefono: string;
}
