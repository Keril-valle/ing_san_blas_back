import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Workbook, ValueType } from 'exceljs';
import { And, LessThan, MoreThanOrEqual, type Repository } from 'typeorm';
import { CicaExportService } from '../../Modules/Cica/cica-export.service';
import { BautismoExportService } from '../../Modules/CatequesisBautismo/bautismo-export.service';
import { InscripcionCica } from '../../Modules/Cica/Entities/inscripcion-cica.entity';
import { InscripcionCatequesisBautismo } from '../../Modules/CatequesisBautismo/Entities/inscripcion-catequesis-bautismo.entity';
import { fechaExcelMatricula } from './excel-matriculas';

const base = {
  nombre: '=2+2',
  apellido1: 'Prueba',
  apellido2: null,
  cedula: '012345678901',
  fechaNacimiento: '1990-01-01',
  nacionalidad: 'Costarricense',
  telefono: '0888-8888',
  provincia: 'Guanacaste',
  canton: 'Nicoya',
  distrito: 'Nicoya',
  estado: 'Pendiente',
  fechaSolicitud: new Date('2026-10-28T03:00:00Z'),
};
const direccion =
  '200 metros al norte y 75 al este del parque central, casa azul con portón negro.';

// Se abre el XLSX real: no basta con que el método devuelva un Buffer.
async function abrir(buffer: Buffer) {
  const libro = new Workbook();
  await libro.xlsx.load(buffer);
  return libro.worksheets[0];
}

describe('Excel de CICA y bautismo', () => {
  const findCica = jest.fn();
  const findBautismo = jest.fn();
  const cica = new CicaExportService({
    find: findCica,
  } as unknown as Repository<InscripcionCica>);
  const bautismo = new BautismoExportService({
    find: findBautismo,
  } as unknown as Repository<InscripcionCatequesisBautismo>);
  beforeEach(() => {
    jest.clearAllMocks();
    findCica.mockResolvedValue([
      Object.assign(new InscripcionCica(), base, {
        correo: 'prueba@example.test',
        direccionHogar: direccion,
        necesitaBautizo: true,
        necesitaConfirmacion: true,
      }),
    ]);
    findBautismo.mockResolvedValue([
      Object.assign(new InscripcionCatequesisBautismo(), base, {
        parroquiaOrigen: 'San Blas',
        barrio: 'Centro',
        condicion: 'padre_madre',
        fechaInicioCatequesis: null,
        fechaFinalizacionCatequesis: null,
        responsableCertifica: null,
      }),
    ]);
  });

  it('conserva la apariencia juvenil, cédulas de texto, fechas y dirección completa en una nota', async () => {
    const resultado = await cica.exportar();
    const hoja = await abrir(resultado.buffer);
    expect(resultado.total).toBe(1);
    expect(resultado.fileName).toMatch(
      /^inscripciones_cica_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
    expect(hoja.getCell('A1').value).toBe('Parroquia San Blas');
    expect(hoja.getCell('A1').fill).toMatchObject({
      fgColor: { argb: 'FF003366' },
    });
    expect(hoja.getCell('A2').font.color).toEqual({ argb: 'FFD4AF37' });
    expect(hoja.getCell('A4').fill).toMatchObject({
      fgColor: { argb: 'FFD4AF37' },
    });
    expect(hoja.getCell('A5').value).toBe('Nombre');
    expect(hoja.getCell('D6').value).toBe('012345678901');
    expect(hoja.getCell('D6').type).toBe(ValueType.String);
    expect(hoja.getCell('A6').value).toBe('=2+2');
    expect(hoja.getCell('A6').type).toBe(ValueType.String);
    expect(hoja.getCell('E6').value).toEqual(new Date('1990-01-01T00:00:00Z'));
    expect(hoja.getCell('O6').value).toEqual(new Date('2026-10-27T00:00:00Z'));
    expect(hoja.getCell('O6').numFmt).toBe('dd/mm/yyyy');
    expect(hoja.getCell('M6').value).toBe('Bautizo, Confirmación');
    expect(hoja.getCell('L6').value).toMatch(/\.\.\.$/);
    expect(JSON.stringify(hoja.getCell('L6').note)).toContain(direccion);
    expect(hoja.getColumn(12).width).toBe(50);
    expect(hoja.views[0]).toMatchObject({
      state: 'frozen',
      ySplit: 5,
      showGridLines: false,
    });
    expect(hoja.autoFilter).toBe('A5:O6');
    expect(hoja.pageSetup.orientation).toBe('landscape');
  });

  it('exporta más de una página y colorea estados sin cambiar las filas originales', async () => {
    const filas = Array.from({ length: 12 }, (_, id) =>
      Object.freeze({
        ...base,
        id,
        estado: ['Pendiente', 'Aprobada', 'Rechazada'][id % 3],
      }),
    );
    findCica.mockResolvedValue(filas);
    const resultado = await cica.exportar();
    const hoja = await abrir(resultado.buffer);
    expect(resultado.total).toBe(12);
    expect(hoja.rowCount).toBe(17);
    expect(hoja.getCell('N6').fill).toMatchObject({
      fgColor: { argb: 'FFFFF7ED' },
    });
    expect(hoja.getCell('N7').fill).toMatchObject({
      fgColor: { argb: 'FFECFDF5' },
    });
    expect(hoja.getCell('N8').fill).toMatchObject({
      fgColor: { argb: 'FFFEF2F2' },
    });
    expect(hoja.getCell('A7').fill).toMatchObject({
      fgColor: { argb: 'FFF1F5FA' },
    });
    expect(findCica).toHaveBeenCalledWith({
      where: {},
      order: { fechaSolicitud: 'DESC', id: 'DESC' },
    });
  });

  it.each(['cica', 'bautismo'] as const)(
    '%s filtra fechas de inscripción inclusivas y estado en la base, sin take/skip',
    async (modulo) => {
      const servicio = modulo === 'cica' ? cica : bautismo;
      const find = modulo === 'cica' ? findCica : findBautismo;
      const resultado = await servicio.exportar({
        estado: 'Aprobada',
        desde: '2026-10-01',
        hasta: '2026-10-31',
      });
      expect(find).toHaveBeenCalledWith({
        where: {
          estado: 'Aprobada',
          fechaSolicitud: And(
            MoreThanOrEqual(new Date('2026-10-01T06:00:00Z')),
            LessThan(new Date('2026-11-01T06:00:00Z')),
          ),
        },
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
      const hoja = await abrir(resultado.buffer);
      expect(hoja.getCell('A3').value).toContain(
        'Inscripción desde: 01/10/2026    Hasta: 31/10/2026',
      );
      expect(resultado.fileName).toContain(
        'desde_2026_10_01_hasta_2026_10_31_aprobada',
      );
    },
  );

  for (const modulo of ['cica', 'bautismo'] as const) {
    it(`${modulo} permite solo desde o solo hasta y un rango del mismo día`, async () => {
      const servicio = modulo === 'cica' ? cica : bautismo;
      const find = modulo === 'cica' ? findCica : findBautismo;
      await servicio.exportar({ desde: '2026-10-28' });
      expect(find).toHaveBeenLastCalledWith({
        where: {
          fechaSolicitud: MoreThanOrEqual(new Date('2026-10-28T06:00:00Z')),
        },
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
      await servicio.exportar({ hasta: '2026-10-28' });
      expect(find).toHaveBeenLastCalledWith({
        where: { fechaSolicitud: LessThan(new Date('2026-10-29T06:00:00Z')) },
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
      await servicio.exportar({ desde: '2026-10-28', hasta: '2026-10-28' });
      expect(find).toHaveBeenLastCalledWith({
        where: {
          fechaSolicitud: And(
            MoreThanOrEqual(new Date('2026-10-28T06:00:00Z')),
            LessThan(new Date('2026-10-29T06:00:00Z')),
          ),
        },
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
    });

    it(`${modulo} rechaza un rango invertido antes de consultar`, async () => {
      await expect(
        (modulo === 'cica' ? cica : bautismo).exportar({
          desde: '2026-10-28',
          hasta: '2026-10-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(
        modulo === 'cica' ? findCica : findBautismo,
      ).not.toHaveBeenCalled();
    });
  }

  it('bautismo conserva condición legible, nacionalidad opcional y certificación vacía sin inventar fechas', async () => {
    const { buffer } = await bautismo.exportar({
      estado: 'Pendiente',
    });
    const hoja = await abrir(buffer);
    expect(hoja.getCell('A2').value).toBe('Catequesis para el bautismo');
    expect(hoja.getCell('M6').value).toBe('Padre/Madre');
    expect(hoja.getCell('P6').value ?? '').toBe('');
    expect(hoja.getCell('Q6').value ?? '').toBe('');
    expect(hoja.getCell('R6').value ?? '').toBe('');
    expect(findBautismo).toHaveBeenCalledWith({
      where: { estado: 'Pendiente' },
      order: { fechaSolicitud: 'DESC', id: 'DESC' },
    });
  });

  it('incluye las fechas y el responsable de las catequesis certificadas', async () => {
    findBautismo.mockResolvedValue([
      {
        ...base,
        estado: 'Aprobada',
        condicion: 'padrino_madrina',
        fechaInicioCatequesis: '2026-01-01',
        fechaFinalizacionCatequesis: '2026-02-01',
        responsableCertifica: 'Responsable Local',
      },
    ]);
    const { buffer, fileName } = await bautismo.exportar({
      estado: 'Aprobada',
    });
    const hoja = await abrir(buffer);
    expect(hoja.getCell('M6').value).toBe('Padrino/Madrina');
    expect(hoja.getCell('P6').value).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(hoja.getCell('Q6').value).toEqual(new Date('2026-02-01T00:00:00Z'));
    expect(hoja.getCell('R6').value).toBe('Responsable Local');
    expect(fileName).toMatch(
      /^inscripciones_bautismo_aprobada_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
  });

  it.each(['cica', 'bautismo'])(
    'responde 404 si %s no tiene resultados',
    async (modulo) => {
      findCica.mockResolvedValue([]);
      findBautismo.mockResolvedValue([]);
      await expect(
        (modulo === 'cica' ? cica : bautismo).exportar(),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('no convierte fechas ausentes en fechas inválidas', () => {
    expect(fechaExcelMatricula(null)).toBeNull();
    expect(fechaExcelMatricula(undefined)).toBeNull();
  });
});
