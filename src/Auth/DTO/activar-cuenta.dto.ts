import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ValidarEnlaceActivacionDto } from './validar-enlace-activacion.dto';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ActivarCuentaDto extends ValidarEnlaceActivacionDto {
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
