import { Injectable, NotFoundException } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { CatequesisService } from './catequesis.service';

const COLUMNAS_EXPORTADAS = [
  'Nombre',
  'Primer apellido',
  'Segundo apellido',
  'Fecha de nacimiento',
  'Centro de catequesis',
  'Nivel a inscribirse',
  'Estado de inscripción',
  'Fecha de inscripción',
] as const;

const ANCHOS_COLUMNA = [22, 20, 20, 22, 26, 20, 22, 22];
const FILA_ENCABEZADO = 5;
const AZUL = 'FF003366';
const DORADO = 'FFD4AF37';
const CREMA = 'FFF8F5EF';
const BLANCO = 'FFFFFFFF';
const TEXTO = 'FF1F2937';
const GRIS = 'FF64748B';
const BORDE = 'FFE2E8F0';
const FILA_ALTERNA = 'FFF1F5FA';

type FilaExportada = {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  centroCatequesis: string;
  nivelAInscribirse: string;
  estado: string;
  fechaSolicitud: Date;
};

type FiltrosExportacion = {
  estado?: string;
  nivel?: string;
  filial?: string;
};

@Injectable()
export class CatequesisExportService {
  constructor(private readonly catequesisService: CatequesisService) {}

  async exportar(filtros: FiltrosExportacion = {}): Promise<{ buffer: Buffer; fileName: string; total: number }> {
    const filas = await this.catequesisService.findForExport(filtros);
    if (filas.length === 0) {
      throw new NotFoundException({
        mensaje:
          'No hay solicitudes de catequesis para los filtros seleccionados.',
      });
    }

    const buffer = await this.generarContenidoExcel(filas, filtros);

    return {
      buffer,
      fileName: this.generarNombreArchivo(filtros),
      total: filas.length,
    };
  }

  private async generarContenidoExcel(
    filas: FilaExportada[],
    filtros: FiltrosExportacion,
  ): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'Parroquia San Blas';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(this.nombreHoja(filtros), {
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
        oddFooter:
          '&LParroquia San Blas&CInscripciones de catequesis&RPágina &P de &N',
      },
    });

    const columnas = COLUMNAS_EXPORTADAS.length;
    this.pintarBanner(worksheet, columnas, filas.length, filtros);
    this.pintarEncabezado(worksheet);
    this.pintarFilas(worksheet, filas);

    ANCHOS_COLUMNA.forEach((ancho, indice) => {
      worksheet.getColumn(indice + 1).width = ancho;
    });

    const ultimaFila = FILA_ENCABEZADO + filas.length;
    worksheet.autoFilter = {
      from: { row: FILA_ENCABEZADO, column: 1 },
      to: { row: ultimaFila, column: columnas },
    };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private pintarBanner(
    worksheet: Worksheet,
    columnas: number,
    total: number,
    filtros: FiltrosExportacion,
  ): void {
    worksheet.mergeCells(1, 1, 1, columnas);
    worksheet.mergeCells(2, 1, 2, columnas);
    worksheet.mergeCells(3, 1, 3, columnas);
    worksheet.mergeCells(4, 1, 4, columnas);

    const titulo = worksheet.getCell(1, 1);
    titulo.value = 'Parroquia San Blas';
    titulo.font = {
      name: 'Calibri',
      bold: true,
      size: 18,
      color: { argb: BLANCO },
    };
    titulo.fill = this.relleno(AZUL);
    titulo.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 32;

    const subtitulo = worksheet.getCell(2, 1);
    subtitulo.value = 'Inscripciones de catequesis';
    subtitulo.font = {
      name: 'Calibri',
      size: 12,
      color: { argb: DORADO },
    };
    subtitulo.fill = this.relleno(AZUL);
    subtitulo.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    const solicitudes = total === 1 ? 'solicitud' : 'solicitudes';
    const resumen = worksheet.getCell(3, 1);
    resumen.value = `Filial: ${filtros.filial?.trim() || 'Todas'}    Nivel: ${this.etiquetaNivelFiltro(filtros.nivel)}    Estado: ${this.etiquetaEstadoFiltro(filtros.estado)}    Generado: ${this.formatearFechaHora(new Date())}    Total: ${total} ${solicitudes}`;
    resumen.font = { name: 'Calibri', size: 10, color: { argb: GRIS } };
    resumen.fill = this.relleno(CREMA);
    resumen.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 22;

    const linea = worksheet.getCell(4, 1);
    linea.fill = this.relleno(DORADO);
    worksheet.getRow(4).height = 6;
  }

  private pintarEncabezado(worksheet: Worksheet): void {
    const encabezado = worksheet.getRow(FILA_ENCABEZADO);
    COLUMNAS_EXPORTADAS.forEach((nombre, indice) => {
      const celda = encabezado.getCell(indice + 1);
      celda.value = nombre;
      celda.font = {
        name: 'Calibri',
        bold: true,
        size: 11,
        color: { argb: BLANCO },
      };
      celda.fill = this.relleno(AZUL);
      celda.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      celda.border = this.borde(AZUL);
    });
    encabezado.height = 26;
  }

  private pintarFilas(
    worksheet: Worksheet,
    filas: FilaExportada[],
  ): void {
    filas.forEach((fila, indice) => {
      const row = worksheet.getRow(FILA_ENCABEZADO + 1 + indice);
      const fondo = indice % 2 === 0 ? BLANCO : FILA_ALTERNA;
      const valores = [
        fila.nombre,
        fila.primerApellido,
        fila.segundoApellido,
        this.formatearFecha(fila.fechaNacimiento),
        fila.centroCatequesis,
        this.etiquetaNivel(fila.nivelAInscribirse),
        fila.estado,
        this.formatearFechaHora(fila.fechaSolicitud),
      ];

      valores.forEach((valor, columna) => {
        const celda = row.getCell(columna + 1);
        celda.value = valor || '';
        celda.font = { name: 'Calibri', size: 11, color: { argb: TEXTO } };
        celda.fill = this.relleno(fondo);
        celda.alignment = {
          vertical: 'middle',
          horizontal: columna === 3 || columna >= 5 ? 'center' : 'left',
        };
        celda.border = this.borde(BORDE);
      });

      const estado = row.getCell(7);
      const colores = this.coloresEstado(fila.estado);
      estado.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: colores.texto },
      };
      estado.fill = this.relleno(colores.fondo);
      row.height = 22;
    });
  }

  private relleno(argb: string) {
    return {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb },
    };
  }

  private borde(argb: string) {
    const lado = { style: 'thin' as const, color: { argb } };
    return { top: lado, left: lado, bottom: lado, right: lado };
  }

  private coloresEstado(estado: string): { fondo: string; texto: string } {
    const valor = estado.trim().toLowerCase();
    if (valor.startsWith('aprob')) {
      return { fondo: 'FFECFDF5', texto: 'FF047857' };
    }
    if (valor.startsWith('rechaz')) {
      return { fondo: 'FFFEF2F2', texto: 'FFB91C1C' };
    }
    return { fondo: 'FFFFF7ED', texto: 'FFC2410C' };
  }

  private etiquetaNivel(nivel: string): string {
    const valor = nivel.trim().toLowerCase();
    if (valor === 'primero') return 'Primer nivel';
    if (valor === 'sétimo' || valor === 'setimo' || valor === 'septimo') {
      return 'Sétimo nivel';
    }
    return nivel.trim();
  }

  private etiquetaNivelFiltro(nivel?: string): string {
    return nivel ? this.etiquetaNivel(nivel) : 'Todos';
  }

  private etiquetaEstadoFiltro(estado?: string): string {
    if (!estado) return 'Todos';
    const valor = estado.trim().toLowerCase();
    if (valor.startsWith('aprob')) return 'Aprobadas';
    if (valor.startsWith('rechaz')) return 'Rechazadas';
    if (valor.startsWith('pend')) return 'Pendientes';
    return estado;
  }

  private formatearFecha(valor: string): string {
    const [anio, mes, dia] = valor.slice(0, 10).split('-');
    if (!anio || !mes || !dia) return valor;
    return `${dia}/${mes}/${anio}`;
  }

  private formatearFechaHora(fecha: Date): string {
    return new Intl.DateTimeFormat('es-CR', {
      timeZone: 'America/Costa_Rica',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(fecha)
      .replace(',', '');
  }

  private nombreHoja(filtros: FiltrosExportacion): string {
    const partes = ['Inscripciones'];
    if (filtros.filial) partes.push(filtros.filial);
    if (filtros.nivel) partes.push(filtros.nivel);
    if (filtros.estado) partes.push(filtros.estado);
    return partes.join(' ').slice(0, 31);
  }

  private generarNombreArchivo(filtros: FiltrosExportacion): string {
    const piezas = ['inscripciones'];
    if (filtros.filial) piezas.push(this.slug(filtros.filial));
    if (filtros.nivel) piezas.push(this.slug(filtros.nivel));
    if (filtros.estado) piezas.push(this.slug(filtros.estado));
    piezas.push(new Date().toISOString().slice(0, 10));
    return `${piezas.join('_')}.xlsx`;
  }

  private slug(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }
}
