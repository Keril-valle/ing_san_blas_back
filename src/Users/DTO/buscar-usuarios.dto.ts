import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BuscarUsuariosDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'El estado ingresado no es válido',
  })
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  // whitelist de columnas ordenables: solo las que el service sabe mapear, nunca un texto libre
  @IsOptional()
  @IsIn(['nombre', 'email', 'telefono', 'role', 'state', 'createdAt'], {
    message: 'El campo de ordenamiento no es válido',
  })
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'La dirección de ordenamiento debe ser asc o desc',
  })
  sortDirection?: 'asc' | 'desc';
}
