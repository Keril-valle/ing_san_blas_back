import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';
import { IDS_PERMISOS_ROL } from '../../Common/Constants/permisos-rol';

export class CreateRolDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El nombre del rol debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio.' })
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres.' })
  nombre: string;

  @Transform(transformarTexto)
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(400, {
    message: 'La descripción no puede superar 400 caracteres.',
  })
  descripcion?: string;

  @IsArray({ message: 'Los permisos deben enviarse como lista.' })
  @ArrayUnique({ message: 'Hay permisos repetidos.' })
  @IsString({ each: true, message: 'Cada permiso debe ser texto.' })
  @IsIn(IDS_PERMISOS_ROL, {
    each: true,
    message: 'Hay permisos que no son válidos.',
  })
  permisos: string[];
}
