import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchSacramentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;
}
