export const ESTADOS_INSCRIPCION_VALIDOS = [
  'Pendiente',
  'Aprobada',
  'Rechazada',
] as const;

export const NIVELES_INSCRIPCION_VALIDOS = ['Primero', 'Sétimo'] as const;

export const MENSAJE_NIVEL_INVALIDO =
  'El nivel a inscribirse solo puede ser Primero o Sétimo.';
export const MENSAJE_ESTADO_INVALIDO =
  'El estado solo puede ser Pendiente, Aprobada o Rechazada.';
export const MENSAJE_ID_INVALIDO = 'El id debe ser mayor que 0.';
export const MENSAJE_NO_ENCONTRADO =
  'No se encontró una inscripción con el id indicado.';
export const MENSAJE_FECHA_NACIMIENTO_FUTURA =
  'La fecha de nacimiento no puede ser futura.';
export const MENSAJE_FECHA_BAUTISMO_FUTURA =
  'La fecha de bautismo no puede ser futura.';

export function esIdValido(id: number): boolean {
  return id > 0;
}

export function normalizarEstadoInscripcion(
  estado?: string | null,
): string | null {
  if (!estado?.trim()) {
    return null;
  }

  const valor = estado.trim();
  const encontrado = ESTADOS_INSCRIPCION_VALIDOS.find(
    (item) => item.toLowerCase() === valor.toLowerCase(),
  );

  return encontrado ?? null;
}

export function normalizarNivelInscripcion(
  nivel?: string | null,
): string | null {
  if (!nivel?.trim()) {
    return null;
  }

  const valor = nivel.trim().toLowerCase();
  if (valor === 'primero') return 'Primero';
  if (valor === 'sétimo' || valor === 'setimo' || valor === 'septimo')
    return 'Sétimo';

  return NIVELES_INSCRIPCION_VALIDOS.find(
    (item) => item.toLowerCase() === valor,
  ) ?? null;
}

export function validarFechaNoFutura(fecha?: string | null): boolean {
  if (!fecha?.trim()) {
    return true;
  }

  const parsed = new Date(`${fecha.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return parsed <= hoy;
}
