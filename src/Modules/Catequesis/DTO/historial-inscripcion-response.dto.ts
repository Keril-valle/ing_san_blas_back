export class HistorialInscripcionCatequesisDto {
  id: number;
  nombreCatequizando: string;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  fechaSolicitud: Date;
  telefonoEncargada: string;
  nombreEncargado: string;
  observacionAdministrativa: string | null;
  fechaActualizacionEstado: Date | null;
  revisor: string | null;
}
