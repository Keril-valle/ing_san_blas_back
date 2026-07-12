export class InscripcionResumenDto {
  id: number;
  nombreCatequizando: string;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  fechaSolicitud: Date;
  telefonoEncargada: string;
}

export class CatequizandoDetalleDto {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  direccionExacta: string;
}

export class BautismoDetalleDto {
  parroquia: string;
  fecha: string | null;
  tomo: string;
  folio: string;
  asiento: string;
}

export class AdecuacionDetalleDto {
  requiereAdecuacionCentroEducativo: boolean | null;
  descripcionAdecuacion: string;
}

export class CondicionSaludDetalleDto {
  portadorEnfermedadCronica: boolean | null;
  descripcionEnfermedad: string;
}

export class MadreDetalleDto {
  nombre: string;
  apellidos: string;
  direccionExacta: string;
  ciudad: string;
  provincia: string;
  telefono: string;
}

export class PersonaInscribeDetalleDto {
  nombre: string;
  apellidos: string;
  parentesco: string;
}

export class PagoDetalleDto {
  metodoPago: string;
  numeroComprobanteSinpe: string;
  comprobanteArchivo: string;
  monto: number;
}

export class InscripcionDetalleDto {
  id: number;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  fechaSolicitud: Date;
  feBautismoArchivo: string;
  observacionAdministrativa: string | null;
  catequizando: CatequizandoDetalleDto;
  bautismo: BautismoDetalleDto;
  adecuacion: AdecuacionDetalleDto;
  condicionSalud: CondicionSaludDetalleDto;
  madre: MadreDetalleDto;
  personaInscribe: PersonaInscribeDetalleDto;
  pago: PagoDetalleDto;
}

export class CrearInscripcionResponseDto {
  id: number;
  mensaje: string;
  estado: string;
  fechaSolicitud: Date;
}

export class ActualizarEstadoResponseDto {
  id: number;
  mensaje: string;
  estado: string;
  observacionAdministrativa: string | null;
  fechaActualizacionEstado: Date;
}
