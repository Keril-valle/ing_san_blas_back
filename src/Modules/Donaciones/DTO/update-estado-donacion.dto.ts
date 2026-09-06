import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEstadoDonacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado enviado no es válido.' })
  estado: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'El detalle de aprobación no debe exceder 500 caracteres',
  })
  detalle?: string;
}
