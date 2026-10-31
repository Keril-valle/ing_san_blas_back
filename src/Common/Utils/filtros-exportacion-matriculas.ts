import { BadRequestException } from '@nestjs/common';
import { And, LessThan, MoreThanOrEqual } from 'typeorm';
import type { FindOperator } from 'typeorm';
import type { ExportarMatriculasDto } from '../DTO/exportar-matriculas.dto';

// Incluye los días completos en Costa Rica, sin depender de la zona horaria del servidor.
export function whereExportacionMatriculas(filtros: ExportarMatriculasDto): {
  estado?: string;
  fechaSolicitud?: FindOperator<Date>;
} {
  const { desde, hasta, estado } = filtros;
  if (desde && hasta && desde > hasta) {
    throw new BadRequestException({
      mensaje: 'La fecha desde no puede ser posterior a la fecha hasta.',
    });
  }
  const inicio = desde ? new Date(`${desde}T00:00:00-06:00`) : undefined;
  const fin = hasta ? new Date(`${hasta}T00:00:00-06:00`) : undefined;
  if (fin) fin.setUTCDate(fin.getUTCDate() + 1); // límite exclusivo: también incluye la última fracción del día hasta
  const fechaSolicitud =
    inicio && fin
      ? And(MoreThanOrEqual(inicio), LessThan(fin))
      : inicio
        ? MoreThanOrEqual(inicio)
        : fin
          ? LessThan(fin)
          : undefined;
  return {
    ...(estado ? { estado } : {}),
    ...(fechaSolicitud ? { fechaSolicitud } : {}),
  };
}

// Deja visibles los mismos filtros del modal dentro del archivo descargado.
export function resumenExportacionMatriculas(
  filtros: ExportarMatriculasDto,
): string {
  const desde = filtros.desde?.split('-').reverse().join('/') ?? 'Sin límite';
  const hasta = filtros.hasta?.split('-').reverse().join('/') ?? 'Sin límite';
  return `Inscripción desde: ${desde}    Hasta: ${hasta}    Estado: ${filtros.estado ?? 'Todos'}`;
}
