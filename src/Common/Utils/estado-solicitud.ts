export type EstadoSolicitudNormalizado =
  'pendiente' | 'aprobado' | 'rechazado' | 'archivado';

export function normalizarEstadoSolicitud(
  estado?: string | null,
): EstadoSolicitudNormalizado {
  const valor = String(estado ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (!valor || valor === 'pendiente') {
    return 'pendiente';
  }

  if (['aprobado', 'aprobada', 'aceptada'].includes(valor)) {
    return 'aprobado';
  }

  if (['rechazado', 'rechazada', 'denegada'].includes(valor)) {
    return 'rechazado';
  }

  if (['archivado', 'archivada', 'guardada'].includes(valor)) {
    return 'archivado';
  }

  return 'pendiente';
}

export function isEstadoPendiente(estado?: string | null): boolean {
  return normalizarEstadoSolicitud(estado) === 'pendiente';
}

export function isEstadoRechazado(estado?: string | null): boolean {
  return normalizarEstadoSolicitud(estado) === 'rechazado';
}

export function isEstadoArchivado(estado?: string | null): boolean {
  return normalizarEstadoSolicitud(estado) === 'archivado';
}
