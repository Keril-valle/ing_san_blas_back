import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class UpdateUsuarioDto extends PartialType(
  OmitType(RegisterDto, ['email'] as const),
) {
  @ValidateIf((object) => object.password !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;

  @IsOptional()
  @IsString({ message: 'El rol debe ser texto.' })
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
