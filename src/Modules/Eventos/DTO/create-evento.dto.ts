import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsString()
  fechaInicio: string;

  @IsOptional()
  @IsString()
  fechaFin?: string | null;

  @IsString()
  lugar: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}
