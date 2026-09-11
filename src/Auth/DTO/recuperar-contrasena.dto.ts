import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecuperarContrasenaDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;
}
