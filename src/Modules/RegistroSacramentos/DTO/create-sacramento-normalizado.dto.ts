import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TipoSacramentoRegistro } from '../../../Common/Enums/TipoSacramentoRegistro';
import { ParentescoAbueloRegistro } from '../../../Common/Enums/ParentescoAbueloRegistro';

// Datos de una persona tal como los envía el formulario (sin IDs).
// El backend busca por cédula o crea la persona si no existe.
export class PersonaInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  cedula?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primerApellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nacionalidad?: string;
}

export class AbueloInputDto extends PersonaInputDto {
  @IsEnum(ParentescoAbueloRegistro)
  parentesco: ParentescoAbueloRegistro;
}

export class BautismoDatosDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  bautizado: PersonaInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  padre?: PersonaInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  madre?: PersonaInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  padrino?: PersonaInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  madrina?: PersonaInputDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  declarante?: PersonaInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbueloInputDto)
  abuelos?: AbueloInputDto[];

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  horaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugarNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reconocimientoLegal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  libro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tomo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  folio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  asiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  firmaParroco?: string;
}

export class PersonaDetalleSacramentoDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  persona: PersonaInputDto;
}

export class MatrimonioDatosDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  contrayente1: PersonaInputDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PersonaInputDto)
  contrayente2: PersonaInputDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  libro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tomo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  folio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  asiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  firmaParroco?: string;
}

export class CreateSacramentoNormalizadoDto {
  @IsEnum(TipoSacramentoRegistro)
  tipo: TipoSacramentoRegistro;

  @IsInt()
  @Min(1)
  idParroquia: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idPresbitero?: number;

  @IsDateString()
  fechaSacramento: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BautismoDatosDto)
  bautismo?: BautismoDatosDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaDetalleSacramentoDto)
  comunion?: PersonaDetalleSacramentoDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaDetalleSacramentoDto)
  confirmacion?: PersonaDetalleSacramentoDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MatrimonioDatosDto)
  matrimonio?: MatrimonioDatosDto;
}

export class UpdateSacramentoNormalizadoDto extends PartialType(
  CreateSacramentoNormalizadoDto,
) {}