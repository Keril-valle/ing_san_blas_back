import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
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

const SACRAMENTOS = {
  bautizo: { campo: 'necesitaBautizo', etiqueta: 'Bautizo' },
  primeraComunion: {
    campo: 'necesitaPrimeraComunion',
    etiqueta: 'Primera comunión',
  },
  confirmacion: { campo: 'necesitaConfirmacion', etiqueta: 'Confirmación' },
} as const;

const COLUMNAS: ColumnaMatricula<InscripcionCica>[] = [
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
  { titulo: 'Correo', ancho: 32, valor: (f) => f.correo },
  { titulo: 'Provincia', ancho: 22, valor: (f) => f.provincia },
  { titulo: 'Cantón', ancho: 22, valor: (f) => f.canton },
  { titulo: 'Distrito', ancho: 22, valor: (f) => f.distrito },
  {
    titulo: 'Dirección exacta',
    ancho: 50,
    valor: (f) => f.direccionHogar,
    limiteTexto: 50,
  },
  {
    titulo: 'Sacramentos requeridos',
    ancho: 42,
    valor: (f) =>
      Object.values(SACRAMENTOS)
        .filter((s) => f[s.campo])
        .map((s) => s.etiqueta)
        .join(', '),
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
];

@Injectable()
export class CicaExportService {
  // Usa el mismo repositorio del módulo; la exportación no necesita otra conexión.
  constructor(
    @InjectRepository(InscripcionCica)
    private readonly repositorio: Repository<InscripcionCica>,
  ) {}

  // Exporta todos los coincidentes; no usa la vista ni la página abierta en el panel.
  async exportar(filtros: ExportarMatriculasDto = {}) {
    const filas = await this.repositorio.find({
      where: whereExportacionMatriculas(filtros),
      order: { fechaSolicitud: 'DESC', id: 'DESC' },
    });
    if (!filas.length)
      throw new NotFoundException({
        mensaje: 'No hay solicitudes de CICA para los filtros seleccionados.',
      });
    return generarExcelMatriculas({
      filas,
      columnas: COLUMNAS,
      titulo: 'Inscripciones CICA',
      hoja: 'Inscripciones CICA',
      filtros: resumenExportacionMatriculas(filtros),
      fileName: nombreExcelMatriculas('cica', [
        filtros.desde ? `desde_${filtros.desde}` : undefined,
        filtros.hasta ? `hasta_${filtros.hasta}` : undefined,
        filtros.estado,
      ]),
    });
  }
}
