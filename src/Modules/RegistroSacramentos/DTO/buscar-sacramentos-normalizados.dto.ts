import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoSacramentoRegistro } from '../../../Common/Enums/TipoSacramentoRegistro';

export class BuscarSacramentosNormalizadosDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cedula?: string;

  @IsOptional()
  @IsEnum(TipoSacramentoRegistro)
  tipo?: TipoSacramentoRegistro;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaDesde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 20;

  @IsOptional()
  @IsIn(['fecha', 'nombre', 'tipo'])
  sortBy?: 'fecha' | 'nombre' | 'tipo';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}
