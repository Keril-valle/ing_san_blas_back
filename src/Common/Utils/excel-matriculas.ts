import { Workbook } from 'exceljs';
import { fechaCostaRica } from './fecha-costa-rica';

const AZUL = 'FF003366';
const DORADO = 'FFD4AF37';
const BLANCO = 'FFFFFFFF';
const BORDE = 'FFE2E8F0';
const FILA_ENCABEZADO = 5;

export type ColumnaMatricula<T> = {
  titulo: string;
  ancho: number;
  valor: (fila: T) => string | Date | null | undefined;
  centrar?: boolean;
  esEstado?: boolean;
  limiteTexto?: number;
};

export type ArchivoMatriculas = {
  buffer: Buffer;
  fileName: string;
  total: number;
};

// Las fechas sin hora se conservan como días de calendario; los instantes se pasan a Costa Rica.
export function fechaExcelMatricula(valor?: string | Date | null): Date | null {
  if (!valor) return null;
  const dia =
    valor instanceof Date
      ? fechaCostaRica(valor)
      : /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? valor
        : fechaCostaRica(new Date(valor));
  const [anio, mes, fecha] = dia.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, fecha));
}

// Solo llegan etiquetas controladas, pero el nombre queda ASCII para descargarlo en cualquier navegador.
export function nombreExcelMatriculas(
  modulo: string,
  filtros: (string | undefined)[],
): string {
  const partes = [
    `inscripciones_${modulo}`,
    ...filtros.filter(Boolean).map((valor) =>
      valor!
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .toLowerCase(),
    ),
    fechaCostaRica(),
  ];
  return `${partes.join('_')}.xlsx`;
}

// Mantiene la misma paleta y estructura del Excel juvenil sin cambiar su exportador.
export async function generarExcelMatriculas<T>(opciones: {
  filas: T[];
  columnas: ColumnaMatricula<T>[];
  titulo: string;
  hoja: string;
  filtros: string;
  fileName: string;
}): Promise<ArchivoMatriculas> {
  const { filas, columnas } = opciones;
  const workbook = new Workbook();
  workbook.creator = 'Parroquia San Blas';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(opciones.hoja, {
    views: [{ state: 'frozen', ySplit: FILA_ENCABEZADO, showGridLines: false }],
    properties: { tabColor: { argb: AZUL } },
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      horizontalCentered: true,
      printTitlesRow: '1:5',
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.55,
        bottom: 0.55,
        header: 0.25,
        footer: 0.25,
      },
    },
    headerFooter: {
      oddFooter: `&LParroquia San Blas&C${opciones.titulo}&RPágina &P de &N`,
    },
  });
  const relleno = (argb: string) => ({
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb },
  });
  const borde = (argb: string) => {
    const lado = { style: 'thin' as const, color: { argb } };
    return { top: lado, left: lado, bottom: lado, right: lado };
  };
  const dia = fechaCostaRica().split('-').reverse().join('/');
  const banners = [
    {
      texto: 'Parroquia San Blas',
      fondo: AZUL,
      color: BLANCO,
      alto: 32,
      tamano: 18,
      negrita: true,
    },
    {
      texto: opciones.titulo,
      fondo: AZUL,
      color: DORADO,
      alto: 20,
      tamano: 12,
    },
    {
      texto: `${opciones.filtros}    Generado: ${dia}    Total: ${filas.length} ${filas.length === 1 ? 'solicitud' : 'solicitudes'}`,
      fondo: 'FFF8F5EF',
      color: 'FF64748B',
      alto: 22,
      tamano: 10,
    },
    { texto: '', fondo: DORADO, color: DORADO, alto: 6, tamano: 10 },
  ];
  banners.forEach((banner, indice) => {
    worksheet.mergeCells(indice + 1, 1, indice + 1, columnas.length);
    const celda = worksheet.getCell(indice + 1, 1);
    celda.value = banner.texto;
    celda.font = {
      name: 'Calibri',
      size: banner.tamano,
      bold: banner.negrita,
      color: { argb: banner.color },
    };
    celda.fill = relleno(banner.fondo);
    celda.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(indice + 1).height = banner.alto;
  });
  columnas.forEach((columna, indice) => {
    worksheet.getColumn(indice + 1).width = columna.ancho;
    const celda = worksheet.getCell(FILA_ENCABEZADO, indice + 1);
    celda.value = columna.titulo;
    celda.font = {
      name: 'Calibri',
      bold: true,
      size: 11,
      color: { argb: BLANCO },
    };
    celda.fill = relleno(AZUL);
    celda.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    celda.border = borde(AZUL);
  });
  worksheet.getRow(FILA_ENCABEZADO).height = 26;
  filas.forEach((fila, indiceFila) => {
    const row = worksheet.getRow(FILA_ENCABEZADO + 1 + indiceFila);
    row.height = 22;
    columnas.forEach((columna, indiceColumna) => {
      const celda = row.getCell(indiceColumna + 1);
      const valor = columna.valor(fila);
      celda.value = valor ?? ''; // un string nunca se convierte en fórmula ni pierde ceros de la cédula
      if (valor instanceof Date) celda.numFmt = 'dd/mm/yyyy';
      celda.font = { name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
      celda.fill = relleno(indiceFila % 2 === 0 ? BLANCO : 'FFF1F5FA');
      celda.border = borde(BORDE);
      celda.alignment = {
        vertical: 'middle',
        horizontal: columna.centrar ? 'center' : 'left',
        wrapText: Boolean(columna.limiteTexto),
      };
      if (
        typeof valor === 'string' &&
        columna.limiteTexto &&
        valor.trim().length > columna.limiteTexto
      ) {
        const cortada = valor.trim().slice(0, columna.limiteTexto - 3);
        const espacio = cortada.lastIndexOf(' ');
        celda.value = `${(espacio > columna.limiteTexto / 2 ? cortada.slice(0, espacio) : cortada).trimEnd()}...`;
        celda.note = valor; // el texto completo sigue disponible, igual que en Juvenil
      }
      if (columna.esEstado) {
        const colores =
          valor === 'Aprobada'
            ? ['FFECFDF5', 'FF047857']
            : valor === 'Rechazada'
              ? ['FFFEF2F2', 'FFB91C1C']
              : ['FFFFF7ED', 'FFC2410C'];
        celda.fill = relleno(colores[0]);
        celda.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: colores[1] },
        };
      }
    });
  });
  worksheet.autoFilter = {
    from: { row: FILA_ENCABEZADO, column: 1 },
    to: { row: FILA_ENCABEZADO + filas.length, column: columnas.length },
  };
  return {
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    fileName: opciones.fileName,
    total: filas.length,
  };
}
