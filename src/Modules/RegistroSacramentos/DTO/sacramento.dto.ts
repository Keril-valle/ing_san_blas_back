export class BautismoDto {
  id: number;
  nombre: string;
  cedula: number;
  primerApellido: string;
  segundoApellido: string;
  nombreParroquia: string;
  fechaBautismo: string;
  annioBautismo: number;
  prebispero: string;
  fechaNacimiento: string;
  horaNacimiento: string;
  nombreAbuelosPaternos: string;
  nombreAbuelosMaternos: string;
}

export class ComunionDto {
  id: number;
  nombre: string;
  diaComunion: string;
  mesComunion: string;
  annioComunion: number;
  lugarComunion: string;
}

export class ConfirmacionDto {
  id: number;
  nombre: string;
  diaConfirmacion: string;
  mesConfirmacion: string;
  annioConfirmacion: number;
  lugarConfirmacion: string;
}

export class MatrimonioDto {
  id: number;
  nombreContrayente: string;
  nombreContrayente2: string;
  diaMatrimonio: string;
  mesMatrimonio: string;
  annioMatrimonio: number;
  lugarMatrimonio: string;
  tomo: number;
  folio: number;
}
