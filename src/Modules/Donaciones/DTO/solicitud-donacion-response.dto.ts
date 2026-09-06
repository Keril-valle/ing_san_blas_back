// Lo que ve el personal en la tabla de solicitudes (sin exponer de más al donante anónimo)
export class SolicitudDonacionResponseDto {
  id: number;
  anonimo: boolean;
  nombre: string;
  correo: string;
  telefono: string | null;
  detalle: string;
  fechaIngreso: Date;
  estado: string;
}
