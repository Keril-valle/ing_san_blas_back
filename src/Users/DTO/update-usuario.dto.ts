import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['email'] as const), //hereda todo menos el email
) {
  @ValidateIf((object) => object.password !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;
}
