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

/**
 * Recorta cada línea de un listado de textos y descarta las vacías.
 * Si el valor no es una lista, se deja igual para que falle la validación.
 */
export function recortarLineas({ value }: { value: unknown }): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const lineas = value.filter(
    (item: unknown): item is string => typeof item === 'string',
  );

  return lineas
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

/**
 * Convierte cualquier URL de YouTube (watch / youtu.be) en su forma
 * `youtube.com/embed/ID` para poder incrustarla directamente.
 */
export function convertirAEmbedYoutube({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  const watchMatch =
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]+)(?:&.*)?$/.exec(
      trimmed,
    );
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)(?:\?.*)?$/.exec(
    trimmed,
  );
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return trimmed;
}
