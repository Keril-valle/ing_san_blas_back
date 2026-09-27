import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RestablecerContrasenaDto {
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El enlace de recuperación no es válido.' })
  @MinLength(43, { message: 'El enlace de recuperación no es válido.' })
  @MaxLength(128, { message: 'El enlace de recuperación no es válido.' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'El enlace de recuperación no es válido.',
  })
  token: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  })
  password: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'Confirme la nueva contraseña.' })
  @MaxLength(64)
  confirmPassword: string;
}
