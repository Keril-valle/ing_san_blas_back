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
