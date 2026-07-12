import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { CatequesisService } from './catequesis.service';

const COLUMNAS_EXPORTADAS = [
  'Nombre',
  'Apellidos',
  'Fecha de nacimiento',
  'Centro de catequesis',
  'Nivel a inscribirse',
  'Estado de inscripción',
  'Fecha de inscripción',
] as const;

@Injectable()
export class CatequesisExportService {
  constructor(private readonly catequesisService: CatequesisService) {}

  async exportar(estado: string): Promise<{ buffer: Buffer; fileName: string }> {
    const filas = await this.catequesisService.findForExport(estado);
    const buffer = await this.generarContenidoExcel(filas, estado);

    return {
      buffer,
      fileName: this.generarNombreArchivo(estado),
    };
  }

  private async generarContenidoExcel(
    filas: Array<{
      nombre: string;
      apellidos: string;
      fechaNacimiento: string;
      centroCatequesis: string;
      nivelAInscribirse: string;
      estado: string;
      fechaSolicitud: Date;
    }>,
    estado: string,
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const nombreHoja =
      estado.toLowerCase() === 'aprobada'
        ? 'Inscripciones aprobadas'
        : `Inscripciones ${estado}`;
    const worksheet = workbook.addWorksheet(nombreHoja);

    worksheet.addRow([...COLUMNAS_EXPORTADAS]);
    worksheet.getRow(1).font = { bold: true };

    for (const fila of filas) {
      const row = worksheet.addRow([
        fila.nombre,
        fila.apellidos,
        new Date(`${fila.fechaNacimiento}T00:00:00`),
        fila.centroCatequesis,
        fila.nivelAInscribirse,
        fila.estado,
        fila.fechaSolicitud,
      ]);

      row.getCell(3).numFmt = 'dd/MM/yyyy';
      row.getCell(7).numFmt = 'dd/MM/yyyy HH:mm';
    }

    worksheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = cell.value?.toString() ?? '';
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = maxLength;
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private generarNombreArchivo(estado: string): string {
    const estadoArchivo = estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const fecha = new Date().toISOString().slice(0, 10);
    return `inscripciones_${estadoArchivo}_${fecha}.xlsx`;
  }
}
