export class HistorialInscripcionCatequesisDto {
  id: number;
  nombreCatequizando: string;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  fechaSolicitud: string;
  telefonoEncargada: string;
  nombreEncargado: string;
  observacionAdministrativa: string | null;
  fechaActualizacionEstado: Date | null;
  revisor: string | null;
}
