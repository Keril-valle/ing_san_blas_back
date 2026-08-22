import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
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

class BautismoDatosDto {
  @IsInt()
  @Min(1)
  idBautizado: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idPadre?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMadre?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idPadrino?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMadrina?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idDeclarante?: number;

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

class PersonaSacramentoDatosDto {
  @IsInt()
  @Min(1)
  idPersona: number;
}

class MatrimonioDatosDto {
  @IsInt()
  @Min(1)
  idContrayente1: number;

  @IsInt()
  @Min(1)
  idContrayente2: number;

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
  @Type(() => PersonaSacramentoDatosDto)
  comunion?: PersonaSacramentoDatosDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonaSacramentoDatosDto)
  confirmacion?: PersonaSacramentoDatosDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MatrimonioDatosDto)
  matrimonio?: MatrimonioDatosDto;
}

export class UpdateSacramentoNormalizadoDto extends PartialType(
  CreateSacramentoNormalizadoDto,
) {}
