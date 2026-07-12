const pick = <T>(
  source: Record<string, unknown>,
  keys: string[],
): T | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return undefined;
};

export interface BautismoInput {
  id?: number;
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

export interface ComunionInput {
  id?: number;
  nombre: string;
  diaComunion: string;
  mesComunion: string;
  annioComunion: number;
  lugarComunion: string;
}

export interface ConfirmacionInput {
  id?: number;
  nombre: string;
  diaConfirmacion: string;
  mesConfirmacion: string;
  annioConfirmacion: number;
  lugarConfirmacion: string;
}

export interface MatrimonioInput {
  id?: number;
  nombreContrayente: string;
  nombreContrayente2: string;
  diaMatrimonio: string;
  mesMatrimonio: string;
  annioMatrimonio: number;
  lugarMatrimonio: string;
  tomo: number;
  folio: number;
}

export const normalizeBautismoInput = (
  source: Record<string, unknown>,
): BautismoInput => ({
  id: Number(pick(source, ['id', 'Id']) ?? 0),
  nombre: String(pick(source, ['nombre', 'Nombre']) ?? ''),
  cedula: Number(pick(source, ['cedula', 'Cedula']) ?? 0),
  primerApellido: String(
    pick(source, ['primerApellido', 'PrimerApellido']) ?? '',
  ),
  segundoApellido: String(
    pick(source, ['segundoApellido', 'SegundoApellido']) ?? '',
  ),
  nombreParroquia: String(
    pick(source, ['nombreParroquia', 'NombreParroquia']) ?? '',
  ),
  fechaBautismo: String(
    pick(source, ['fechaBautismo', 'FechaBautismo']) ?? '',
  ),
  annioBautismo: Number(
    pick(source, ['annioBautismo', 'AnnioBautismo']) ?? 0,
  ),
  prebispero: String(pick(source, ['prebispero', 'Prebispero']) ?? ''),
  fechaNacimiento: String(
    pick(source, ['fechaNacimiento', 'FechaNacimiento']) ?? '',
  ),
  horaNacimiento: String(
    pick(source, ['horaNacimiento', 'HoraNacimiento']) ?? '',
  ),
  nombreAbuelosPaternos: String(
    pick(source, ['nombreAbuelosPaternos', 'NombreAbuelosPaternos']) ?? '',
  ),
  nombreAbuelosMaternos: String(
    pick(source, ['nombreAbuelosMaternos', 'NombreAbuelosMaternos']) ?? '',
  ),
});

export const normalizeComunionInput = (
  source: Record<string, unknown>,
): ComunionInput => ({
  id: Number(pick(source, ['id', 'Id']) ?? 0),
  nombre: String(pick(source, ['nombre', 'Nombre']) ?? ''),
  diaComunion: String(pick(source, ['diaComunion', 'DiaComunion']) ?? ''),
  mesComunion: String(pick(source, ['mesComunion', 'MesComunion']) ?? ''),
  annioComunion: Number(
    pick(source, ['annioComunion', 'AnnioComunion']) ?? 0,
  ),
  lugarComunion: String(
    pick(source, ['lugarComunion', 'LugarComunion']) ?? '',
  ),
});

export const normalizeConfirmacionInput = (
  source: Record<string, unknown>,
): ConfirmacionInput => ({
  id: Number(pick(source, ['id', 'Id']) ?? 0),
  nombre: String(pick(source, ['nombre', 'Nombre']) ?? ''),
  diaConfirmacion: String(
    pick(source, ['diaConfirmacion', 'DiaConfirmacion']) ?? '',
  ),
  mesConfirmacion: String(
    pick(source, ['mesConfirmacion', 'MesConfirmacion']) ?? '',
  ),
  annioConfirmacion: Number(
    pick(source, ['annioConfirmacion', 'AnnioConfirmacion']) ?? 0,
  ),
  lugarConfirmacion: String(
    pick(source, ['lugarConfirmacion', 'LugarConfirmacion']) ?? '',
  ),
});

export const normalizeMatrimonioInput = (
  source: Record<string, unknown>,
): MatrimonioInput => ({
  id: Number(pick(source, ['id', 'Id']) ?? 0),
  nombreContrayente: String(
    pick(source, ['nombreContrayente', 'NombreContrayente']) ?? '',
  ),
  nombreContrayente2: String(
    pick(source, ['nombreContrayente2', 'NombreContrayente2']) ?? '',
  ),
  diaMatrimonio: String(
    pick(source, ['diaMatrimonio', 'DiaMatrimonio']) ?? '',
  ),
  mesMatrimonio: String(
    pick(source, ['mesMatrimonio', 'MesMatrimonio']) ?? '',
  ),
  annioMatrimonio: Number(
    pick(source, ['annioMatrimonio', 'AnnioMatrimonio']) ?? 0,
  ),
  lugarMatrimonio: String(
    pick(source, ['lugarMatrimonio', 'LugarMatrimonio']) ?? '',
  ),
  tomo: Number(pick(source, ['tomo', 'Tomo']) ?? 0),
  folio: Number(pick(source, ['folio', 'Folio']) ?? 0),
});

export const formatDateOnly = (value: Date | string): string => {
  if (typeof value === 'string') {
    return value.split('T')[0];
  }

  return value.toISOString().slice(0, 10);
};

export const formatHoraNacimiento = (value: unknown): string => {
  if (!value) {
    return '';
  }

  const raw = String(value);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return raw;
  }

  const hours = match[1].padStart(2, '0');
  const minutes = match[2].padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const parseUtcDate = (value: string): Date => {
  const dateOnly = value.split('T')[0];
  return new Date(`${dateOnly}T00:00:00.000Z`);
};

export const toIntervalString = (hora: string): string => {
  const [hours = '0', minutes = '0'] = hora.split(':');
  return `${Number(hours)} hours ${Number(minutes)} minutes`;
};
