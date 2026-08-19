import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class BuscarSacramentosDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}