import type { ObjectLiteral, Repository } from 'typeorm';
import type { ListarMatriculasDto } from '../DTO/listar-matriculas.dto';

// Los comodines del usuario son texto literal, nunca parte del patrón SQL.
const patron = (texto: string) => `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

// Comparte filtros y conteos sin cambiar las rutas ni el contrato legado.
export async function listarMatriculas<T extends ObjectLiteral>(
  repositorio: Repository<T>,
  filtros: ListarMatriculasDto,
  camposBusqueda: string[],
  extra?: { columna: string; valor: string | boolean },
) {
  const consulta = repositorio
    .createQueryBuilder('inscripcion')
    .orderBy('inscripcion.fechaSolicitud', 'DESC')
    .addOrderBy('inscripcion.id', 'DESC'); // desempate estable entre páginas

  consulta.where('inscripcion.estado IN (:...estados)', {
    estados:
      filtros.vista === 'historial' ? ['Aprobada', 'Rechazada'] : ['Pendiente'],
  });
  if (filtros.estado)
    consulta.andWhere('inscripcion.estado = :estado', {
      estado: filtros.estado,
    });
  const nombre =
    "concat_ws(' ', inscripcion.nombre, inscripcion.apellido1, inscripcion.apellido2)";
  if (filtros.nombre)
    consulta.andWhere(`${nombre} ILIKE :nombre`, {
      nombre: patron(filtros.nombre),
    });
  if (filtros.cedula)
    consulta.andWhere('inscripcion.cedula ILIKE :cedula', {
      cedula: patron(filtros.cedula),
    });
  if (filtros.busqueda) {
    consulta.andWhere(
      `concat_ws(' ', ${camposBusqueda.map((campo) => `inscripcion.${campo}`).join(', ')}) ILIKE :busqueda`,
      {
        busqueda: patron(filtros.busqueda),
      },
    );
  }
  if (extra)
    consulta.andWhere(`inscripcion.${extra.columna} = :extra`, {
      extra: extra.valor,
    });

  if (filtros.page === undefined && filtros.limit === undefined)
    return consulta.getMany();
  const page = filtros.page ?? 1;
  const limit = filtros.limit ?? 10;
  const [[data, total], conteos] = await Promise.all([
    consulta
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount(),
    repositorio
      .createQueryBuilder('inscripcion')
      .select('inscripcion.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('inscripcion.estado')
      .getRawMany<{ estado: string; total: string }>(),
  ]);
  const cantidad = (estado: string) =>
    Number(conteos.find((fila) => fila.estado === estado)?.total ?? 0);
  return {
    data,
    total,
    page,
    limit,
    totales: {
      pendientes: cantidad('Pendiente'),
      aprobadas: cantidad('Aprobada'),
      rechazadas: cantidad('Rechazada'),
    },
  };
}
