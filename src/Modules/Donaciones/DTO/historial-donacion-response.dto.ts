// Registro de una donación ya archivada (aprobada o rechazada) para el historial
export class HistorialDonacionResponseDto {
  id: number;
  anonimo: boolean;
  nombre: string;
  correo: string;
  telefono: string | null;
  detalle: string;
  estado: string;
  fechaIngreso: Date;
  motivoRechazo?: string;
  detalleRechazo?: string;
  fechaRechazo?: Date;
  detalleAprobacion?: string;
}