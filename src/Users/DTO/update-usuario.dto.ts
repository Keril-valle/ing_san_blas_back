import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { Role } from '../../Common/Enums/Roles';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class UpdateUsuarioDto extends PartialType(
  OmitType(RegisterDto, ['email'] as const),
) {
  @ValidateIf((object) => object.password !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;

  // si el usuario conservaba un rol custom y no se toca, el frontend no envía role;
  // @IsOptional evita validar cuando viene undefined y por eso no rompe esos casos
  @IsOptional()
  @IsString({ message: 'El rol debe ser texto.' })
  @IsIn(Object.values(Role), {
    message: 'El rol indicado no es un rol válido.',
  })
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(transformarTexto)
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'El teléfono debe tener el formato 8888-8888',
  })
  telefono?: string;
}
