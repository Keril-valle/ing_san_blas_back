export const MESES: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

/**
 * Convierte un valor de mes (nombre en español o número "01".."12")
 * a su representación numérica de dos dígitos. Retorna null si no se reconoce.
 */
export function mesANumero(mes: string | undefined | null): string | null {
  if (!mes) {
    return null;
  }
  const limpio = mes.trim().toLowerCase();
  if (/^\d{1,2}$/.test(limpio)) {
    const n = Number(limpio);
    if (n >= 1 && n <= 12) {
      return n.toString().padStart(2, '0');
    }
    return null;
  }
  return MESES[limpio] ?? null;
}

const FECHA_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Valida una fecha en formato dd/mm/aaaa.
 * - Retorna el objeto con día, mes y año si es válida.
 * - Rechaza fechas inexistentes (ej. 31/02/2025).
 * - Lanza un Error con mensaje descriptivo si el formato o la fecha son inválidos.
 */
export function parseFechaDDMMAAAA(
  valor: string | undefined,
): { dia: string; mes: string; anio: string } | null {
  if (!valor) {
    return null;
  }

  const match = FECHA_REGEX.exec(valor.trim());
  if (!match) {
    throw new Error(
      'El formato de fecha es inválido. Use el formato dd/mm/aaaa.',
    );
  }

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const anio = Number(match[3]);

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    throw new Error('La fecha ingresada no es válida. Revise e intente de nuevo.');
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const valido =
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia;

  if (!valido) {
    throw new Error('La fecha ingresada no es válida. Revise e intente de nuevo.');
  }

  return {
    dia: match[1],
    mes: mes.toString().padStart(2, '0'),
    anio: match[3],
  };
}

/** Retorna la fecha en formato ISO yyyy-mm-dd para comparar rangos, o null si es inválida. */
export function fechaISODesdeDDMMAAAA(
  valor: string | undefined,
): string | null {
  const partes = parseFechaDDMMAAAA(valor);
  if (!partes) {
    return null;
  }
  return `${partes.anio}-${partes.mes}-${partes.dia}`;
}

/** Convierte dia/mes/anio separados (ej. de Comunión/Confirmación/Matrimonio) a ISO yyyy-mm-dd. */
export function fechaISODesdePartes(
  dia: string | undefined | null,
  mes: string | undefined | null,
  anio: number | undefined | null,
): string | null {
  const diaNum = Number(dia);
  const mesNum = mesANumero(mes);
  const anioNum = Number(anio);

  if (!Number.isInteger(diaNum) || diaNum < 1 || diaNum > 31) {
    return null;
  }
  if (!mesNum || !Number.isInteger(anioNum) || anioNum < 1) {
    return null;
  }

  const iso = `${anioNum}-${mesNum}-${diaNum.toString().padStart(2, '0')}`;
  // Verificar que la fecha sea real (ej. rechazar 31/02)
  const fecha = new Date(`${iso}T00:00:00.000Z`);
  const valido =
    fecha.getUTCFullYear() === anioNum &&
    fecha.getUTCMonth() === Number(mesNum) - 1 &&
    fecha.getUTCDate() === diaNum;

  return valido ? iso : null;
}