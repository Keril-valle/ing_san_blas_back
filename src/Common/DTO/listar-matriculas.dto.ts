import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Sin page/limit se conserva el arreglo usado por clientes anteriores.
export class ListarMatriculasDto {
  @IsOptional()
  @IsIn(['solicitudes', 'historial'])
  vista?: 'solicitudes' | 'historial';

  @IsOptional()
  @IsIn(['Pendiente', 'Aprobada', 'Rechazada'])
  estado?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  busqueda?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(20)
  cedula?: string;
}
