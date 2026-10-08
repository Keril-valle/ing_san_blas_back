import { Workbook } from 'exceljs';
import { CatequesisExportService } from './catequesis-export.service';

// Extrae el texto de la nota sea string u objeto, según cómo ExcelJS la reabra.
const textoNota = (celda: { note?: unknown }): string => {
  const nota = celda.note;
  if (typeof nota === 'string') return nota;
  if (nota && typeof nota === 'object' && 'texts' in nota) {
    return ((nota as { texts?: Array<{ text?: string }> }).texts ?? [])
      .map((item) => item.text ?? '')
      .join('');
  }
  return '';
};

describe('CatequesisExportService', () => {
  const direccionLarga =
    '200 metros al norte, 75 metros al este, frente al parque central, casa azul con portón negro.';
  const direccionCorta = 'Frente a la iglesia';

  // Genera el Excel real y lo vuelve a abrir para verificar cómo queda la celda.
  it('recorta la dirección larga con "..." y guarda el texto completo en la nota', async () => {
    const servicio = new CatequesisExportService({
      findForExport: jest.fn().mockResolvedValue([
        {
          nombre: 'Prueba',
          primerApellido: 'Registro',
          segundoApellido: '',
          fechaNacimiento: '2012-04-15',
          centroCatequesis: 'San Blas',
          nivelAInscribirse: 'Sétimo',
          estado: 'Pendiente',
          fechaSolicitud: new Date('2026-10-07T12:00:00.000Z'),
          telefono: '8888-8888',
          direccionExacta: direccionLarga,
        },
      ]),
    } as never);
    const { buffer } = await servicio.exportar();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const celdaDireccion = workbook.worksheets[0].getCell('J6');

    expect(workbook.worksheets[0].getColumn(10).width).toBe(50);
    expect(celdaDireccion.alignment?.wrapText).toBe(true);
    expect(workbook.worksheets[0].getRow(6).height).toBe(22);
    // la celda se ve cortada y con los 3 puntitos, nunca más ancha que la columna
    const direccionVisible =
      typeof celdaDireccion.value === 'string' ? celdaDireccion.value : '';
    expect(direccionVisible).toMatch(/\.\.\.$/);
    expect(direccionVisible.length).toBeLessThanOrEqual(50);
    expect(direccionVisible).not.toBe(direccionLarga);
    // el texto entero queda en la nota para verlo al hacer click en el indicador
    expect(textoNota(celdaDireccion)).toBe(direccionLarga);
  });

  it('deja la dirección corta tal cual y sin nota', async () => {
    const servicio = new CatequesisExportService({
      findForExport: jest.fn().mockResolvedValue([
        {
          nombre: 'Prueba',
          primerApellido: 'Corta',
          segundoApellido: '',
          fechaNacimiento: '2011-08-22',
          centroCatequesis: 'San Blas',
          nivelAInscribirse: 'Primero',
          estado: 'Pendiente',
          fechaSolicitud: new Date('2026-10-07T12:00:00.000Z'),
          telefono: '8888-8888',
          direccionExacta: direccionCorta,
        },
      ]),
    } as never);
    const { buffer } = await servicio.exportar();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const celdaDireccion = workbook.worksheets[0].getCell('J6');

    expect(celdaDireccion.value).toBe(direccionCorta);
    expect(textoNota(celdaDireccion)).toBe('');
  });
});
