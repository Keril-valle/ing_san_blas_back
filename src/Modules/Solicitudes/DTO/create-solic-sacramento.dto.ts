import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { TipoSacramento } from 'src/Common/Enums/TipoSacramento';

export class CreateSolicSacramentoDto {
  @IsString()
  Nombre: string;

  @IsString()
  PrimerApellido: string;

  @IsString()
  SegundoApellido: string;

  @IsNumber()
  Cedula: number;

  @IsEmail()
  Correo: string;

  @IsNumber()
  Telefono: number;

  @IsEnum(TipoSacramento)
  TipoSacramento: TipoSacramento;

  @IsString()
  Motivo: string;

  @IsOptional()
  @IsString()
  Estado?: string;
}
