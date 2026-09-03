import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoSolicitud } from '../../../Common/Enums/EstadoSolicitud';

export class SearchSolicSacramentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cedula?: string;

  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  // Se restringe a los tamaños que ofrece la interfaz para evitar consultas
  // que traigan la tabla completa
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 25, 50])
  pageSize?: number;
}
