import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

// Body del endpoint aparte para rechazar (así el motivo queda guardado y auditado)
export class RechazarDonacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio' })
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'El detalle de rechazo no debe exceder 500 caracteres',
  })
  detalle?: string;
}
