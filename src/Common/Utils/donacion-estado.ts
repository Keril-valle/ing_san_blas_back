export function normalizeDonacionEstado(estado: string | undefined | null): string {
  const value = estado?.trim() ?? 'Pendiente';

  if (
    value.localeCompare('Aceptada', undefined, { sensitivity: 'accent' }) === 0 ||
    value.localeCompare('Aprobado', undefined, { sensitivity: 'accent' }) === 0 ||
    value.localeCompare('Aprobada', undefined, { sensitivity: 'accent' }) === 0
  ) {
    return 'Aprobado';
  }

  if (
    value.localeCompare('Denegada', undefined, { sensitivity: 'accent' }) === 0 ||
    value.localeCompare('Rechazado', undefined, { sensitivity: 'accent' }) === 0 ||
    value.localeCompare('Rechazada', undefined, { sensitivity: 'accent' }) === 0
  ) {
    return 'Rechazado';
  }

  return 'Pendiente';
}
