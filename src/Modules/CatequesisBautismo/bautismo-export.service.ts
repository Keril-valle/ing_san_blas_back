import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesisBautismo } from './Entities/inscripcion-catequesis-bautismo.entity';
import type { ExportarMatriculasDto } from '../../Common/DTO/exportar-matriculas.dto';
import {
  resumenExportacionMatriculas,
  whereExportacionMatriculas,
} from '../../Common/Utils/filtros-exportacion-matriculas';
import {
  fechaExcelMatricula,
  generarExcelMatriculas,
  nombreExcelMatriculas,
} from '../../Common/Utils/excel-matriculas';
import type { ColumnaMatricula } from '../../Common/Utils/excel-matriculas';

const CONDICIONES = {
  padre_madre: 'Padre/Madre',
  padrino_madrina: 'Padrino/Madrina',
  formacion_catequetica: 'Formación Catequética',
} as const;

const COLUMNAS: ColumnaMatricula<InscripcionCatequesisBautismo>[] = [
  { titulo: 'Nombre', ancho: 22, valor: (f) => f.nombre },
  { titulo: 'Primer apellido', ancho: 20, valor: (f) => f.apellido1 },
  { titulo: 'Segundo apellido', ancho: 20, valor: (f) => f.apellido2 },
  { titulo: 'Cédula', ancho: 20, valor: (f) => f.cedula, centrar: true },
  {
    titulo: 'Fecha de nacimiento',
    ancho: 22,
    valor: (f) => fechaExcelMatricula(f.fechaNacimiento),
    centrar: true,
  },
  { titulo: 'Nacionalidad', ancho: 25, valor: (f) => f.nacionalidad },
  { titulo: 'Teléfono', ancho: 18, valor: (f) => f.telefono, centrar: true },
  { titulo: 'Parroquia de origen', ancho: 28, valor: (f) => f.parroquiaOrigen },
  { titulo: 'Provincia', ancho: 22, valor: (f) => f.provincia },
  { titulo: 'Cantón', ancho: 22, valor: (f) => f.canton },
  { titulo: 'Distrito', ancho: 22, valor: (f) => f.distrito },
  { titulo: 'Barrio', ancho: 28, valor: (f) => f.barrio },
  {
    titulo: 'Condición',
    ancho: 28,
    valor: (f) =>
      CONDICIONES[f.condicion as keyof typeof CONDICIONES] ?? f.condicion,
  },
  {
    titulo: 'Estado de inscripción',
    ancho: 22,
    valor: (f) => f.estado,
    centrar: true,
    esEstado: true,
  },
  {
    titulo: 'Fecha de inscripción',
    ancho: 22,
    valor: (f) => fechaExcelMatricula(f.fechaSolicitud),
    centrar: true,
  },
  {
    titulo: 'Inicio de catequesis',
    ancho: 22,
    valor: (f) => fechaExcelMatricula(f.fechaInicioCatequesis),
    centrar: true,
  },
  {
    titulo: 'Finalización de catequesis',
    ancho: 24,
    valor: (f) => fechaExcelMatricula(f.fechaFinalizacionCatequesis),
    centrar: true,
  },
  {
    titulo: 'Responsable que certifica',
    ancho: 30,
    valor: (f) => f.responsableCertifica,
  },
];

@Injectable()
export class BautismoExportService {
  // Lee las inscripciones existentes, sin duplicar almacenamiento ni tocar la certificación.
  constructor(
    @InjectRepository(InscripcionCatequesisBautismo)
    private readonly repositorio: Repository<InscripcionCatequesisBautismo>,
  ) {}

  // La certificación solo se lee; descargar un Excel no cambia el estado de ninguna solicitud.
  async exportar(filtros: ExportarMatriculasDto = {}) {
    const filas = await this.repositorio.find({
      where: whereExportacionMatriculas(filtros),
      order: { fechaSolicitud: 'DESC', id: 'DESC' },
    });
    if (!filas.length)
      throw new NotFoundException({
        mensaje:
          'No hay solicitudes de catequesis para el bautismo para los filtros seleccionados.',
      });
    return generarExcelMatriculas({
      filas,
      columnas: COLUMNAS,
      titulo: 'Catequesis para el bautismo',
      hoja: 'Catequesis bautismo',
      filtros: resumenExportacionMatriculas(filtros),
      fileName: nombreExcelMatriculas('bautismo', [
        filtros.desde ? `desde_${filtros.desde}` : undefined,
        filtros.hasta ? `hasta_${filtros.hasta}` : undefined,
        filtros.estado,
      ]),
    });
  }
}
