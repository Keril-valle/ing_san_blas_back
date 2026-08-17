import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class RechazarSolicitudDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio' })
  motivoRechazo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'El detalle de rechazo no debe exceder 500 caracteres',
  })
  detalleRechazo?: string;
}
