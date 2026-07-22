import { OmitType, PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(
  OmitType(RegisterDto, ['email'] as const),
) {
  @ValidateIf((object) => object.password !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;
}
