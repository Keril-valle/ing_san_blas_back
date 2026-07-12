export class DonacionResponseDto {
  id: number;
  fecha: Date;
  anonimo: boolean;
  nombre: string;
  correo: string;
  telefono: string | null;
  detalle: string;
  estado: string;
}

export class UpdateDonacionEstadoResponseDto {
  donacion: DonacionResponseDto;
  correoEnviado: boolean;
  mensajeCorreo: string;
}
