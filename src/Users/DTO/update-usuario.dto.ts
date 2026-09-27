import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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
  @MaxLength(64)
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
  @IsArray({ message: 'Los roles deben venir como una lista.' })
  @ArrayNotEmpty({ message: 'Debe indicar al menos un rol.' })
  @IsString({ each: true, message: 'Cada rol debe ser texto.' })
  roles?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(transformarTexto)
  @IsString()
  @Matches(/^[1-9]\d{3}-\d{4}$/, {
    message:
      'El teléfono debe tener el formato 8888-8888 y no comenzar con cero',
  })
  telefono?: string;
}
