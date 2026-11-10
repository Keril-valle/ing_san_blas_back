import type {
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
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

  aplicarFiltros(consulta, filtros, camposBusqueda, extra, {
    incluirVista: true,
  });

  if (filtros.page === undefined && filtros.limit === undefined)
    return consulta.getMany();
  const page = filtros.page ?? 1;
  const limit = filtros.limit ?? 10;

  // Los contadores respetan la búsqueda/condición para no mostrar un total
  // global mientras la tabla aparece vacía. No se aplican ni la vista ni el
  // estado para seguir mostrando los tres estados a la vez.
  const conteos = repositorio
    .createQueryBuilder('inscripcion')
    .select('inscripcion.estado', 'estado')
    .addSelect('COUNT(*)', 'total')
    .groupBy('inscripcion.estado');
  aplicarFiltros(conteos, filtros, camposBusqueda, extra, {
    incluirVista: false,
    incluirEstado: false,
  });

  const [[data, total], porEstado] = await Promise.all([
    consulta
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount(),
    conteos.getRawMany<{ estado: string; total: string }>(),
  ]);
  const cantidad = (estado: string) =>
    Number(porEstado.find((fila) => fila.estado === estado)?.total ?? 0);
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

function aplicarFiltros<T extends ObjectLiteral>(
  consulta: SelectQueryBuilder<T>,
  filtros: ListarMatriculasDto,
  camposBusqueda: string[],
  extra: { columna: string; valor: string | boolean } | undefined,
  { incluirVista, incluirEstado = true }: {
    incluirVista: boolean;
    incluirEstado?: boolean;
  },
) {
  let hayCondiciones = false;
  const aplicar = (sql: string, parametros?: ObjectLiteral) => {
    if (!hayCondiciones) {
      consulta.where(sql, parametros);
      hayCondiciones = true;
      return;
    }
    consulta.andWhere(sql, parametros);
  };

  if (incluirVista) {
    aplicar('inscripcion.estado IN (:...estados)', {
      estados:
        filtros.vista === 'historial'
          ? ['Aprobada', 'Rechazada']
          : ['Pendiente'],
    });
  }
  if (incluirEstado && filtros.estado)
    aplicar('inscripcion.estado = :estado', {
      estado: filtros.estado,
    });
  const nombre =
    "concat_ws(' ', inscripcion.nombre, inscripcion.apellido1, inscripcion.apellido2)";
  if (filtros.nombre)
    aplicar(`${nombre} ILIKE :nombre`, {
      nombre: patron(filtros.nombre),
    });
  if (filtros.cedula)
    aplicar('inscripcion.cedula ILIKE :cedula', {
      cedula: patron(filtros.cedula),
    });
  if (filtros.busqueda) {
    aplicar(
      `concat_ws(' ', ${camposBusqueda.map((campo) => `inscripcion.${campo}`).join(', ')}) ILIKE :busqueda`,
      {
        busqueda: patron(filtros.busqueda),
      },
    );
  }
  if (extra)
    aplicar(`inscripcion.${extra.columna} = :extra`, {
      extra: extra.valor,
    });
}
