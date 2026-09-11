/**
 * Recorta espacios de los extremos y unifica espacios internos consecutivos.
 * Si el valor no es texto, se deja igual para que la validación del DTO falle.
 */
export function normalizarTexto(valor: unknown): unknown {
  if (typeof valor !== 'string') {
    return valor;
  }

  return valor.trim().replace(/\s+/g, ' ');
}

export function transformarTexto({ value }: { value: unknown }): unknown {
  return normalizarTexto(value);
}
