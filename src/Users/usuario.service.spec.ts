import type { Repository } from 'typeorm';
import { UsuarioService } from './usuario.service';
import { Usuario } from './Entities/usuario.entity';
import type { RolService } from './rol.service';

// query builder de mentira que solo registra cómo se armó la consulta.
// el 2º genérico de jest.fn() es la tupla de argumentos: sin eso .mock.calls queda any
const crearQueryBuilder = () => {
  const qb = {
    orderBy: jest.fn<unknown, [columna: string, direccion?: string]>(),
    addOrderBy: jest.fn<unknown, [columna: string, direccion?: string]>(),
    take: jest.fn<unknown, [n: number]>(),
    skip: jest.fn<unknown, [n: number]>(),
    andWhere: jest.fn<
      unknown,
      [sql: string, params?: Record<string, unknown>]
    >(),
    getManyAndCount: jest.fn<Promise<[unknown[], number]>, []>(),
  };
  qb.orderBy.mockReturnValue(qb);
  qb.addOrderBy.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.getManyAndCount.mockResolvedValue([[], 0]);
  return qb;
};

const crearServicio = (filas: unknown[] = [], total = 0) => {
  const qb = crearQueryBuilder();
  qb.getManyAndCount.mockResolvedValue([filas, total]);

  const repository = {
    createQueryBuilder: jest.fn(() => qb),
  } as unknown as Repository<Usuario>;

  const service = new UsuarioService(repository, {} as unknown as RolService);
  return { service, qb };
};

type OrdenRegistrada = {
  columna: string | undefined;
  direccion: string | undefined;
  desempate: string[];
};

const ultimaOrdenacion = (
  qb: ReturnType<typeof crearQueryBuilder>,
): OrdenRegistrada => ({
  columna: qb.orderBy.mock.calls[0]?.[0],
  direccion: qb.orderBy.mock.calls[0]?.[1],
  desempate: qb.addOrderBy.mock.calls.map((c) => c[0]),
});

// busca la condición de texto entre todas las andWhere que se registraron
const condicionDeBusqueda = (
  qb: ReturnType<typeof crearQueryBuilder>,
): [sql: string, params: Record<string, unknown> | undefined] | undefined =>
  qb.andWhere.mock.calls.find((c) =>
    String(c[0]).includes('LOWER(usuario.nombre)'),
  ) as [sql: string, params: Record<string, unknown> | undefined] | undefined;

describe('UsuarioService.findAllPaginado — ordenamiento', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ordena por defecto por la fecha de creación descendente', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado();

    const { columna, direccion, desempate } = ultimaOrdenacion(qb);
    expect(columna).toBe('usuario.createdAt');
    expect(direccion).toBe('DESC');
    // sin desempate dos filas con la misma fecha podrían saltarse entre páginas
    expect(desempate).toContain('usuario.id');
  });

  it('ordena ascendente por una columna cuando se lo piden', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(
      1,
      10,
      undefined,
      undefined,
      undefined,
      'nombre',
      'asc',
    );

    const { columna, direccion } = ultimaOrdenacion(qb);
    expect(columna).toBe('usuario.nombre');
    expect(direccion).toBe('ASC');
  });

  it('mapea cada columna de la whitelist a su propiedad real de la entidad', async () => {
    const casos: Array<[string, string]> = [
      ['nombre', 'usuario.nombre'],
      ['email', 'usuario.email'],
      ['telefono', 'usuario.telefono'],
      ['role', 'usuario.role'],
      ['state', 'usuario.isActive'],
      ['createdAt', 'usuario.createdAt'],
    ];

    for (const [sortBy, esperado] of casos) {
      const { service, qb } = crearServicio();
      await service.findAllPaginado(
        1,
        10,
        undefined,
        undefined,
        undefined,
        sortBy,
        'asc',
      );
      expect(ultimaOrdenacion(qb).columna).toBe(esperado);
    }
  });

  it('nunca mete un valor desconocido en orderBy (fallback al default)', async () => {
    // si alguien bypasea el DTO, igual no llega texto libre al SQL
    const { service, qb } = crearServicio();

    await service.findAllPaginado(
      1,
      10,
      undefined,
      undefined,
      undefined,
      'usuario.nombre); DROP TABLE usuario; --',
      'asc',
    );

    const { columna } = ultimaOrdenacion(qb);
    expect(columna).toBe('usuario.createdAt');
    expect(columna).not.toContain('DROP');
    expect(columna).not.toContain('password');
  });

  it('cae al orden por defecto si falta la dirección o viene rara', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(
      1,
      10,
      undefined,
      undefined,
      undefined,
      'nombre',
    );

    // sin sortDirection explícito no es asc → se interpreta como desc
    expect(ultimaOrdenacion(qb).direccion).toBe('DESC');
  });

  it('con sortDirection asc mantiene asc', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(
      1,
      10,
      undefined,
      undefined,
      undefined,
      'email',
      'asc',
    );

    expect(ultimaOrdenacion(qb)).toMatchObject({
      columna: 'usuario.email',
      direccion: 'ASC',
    });
  });
});

describe('UsuarioService.findAllPaginado — paginación', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve data, total, page, pages y limit', async () => {
    const { service } = crearServicio([{ id: 1 }], 25);

    const res = await service.findAllPaginado(2, 10);

    // campo por campo: expect.any() devuelve any y el lint lo marca
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(25);
    expect(res.page).toBe(2);
    expect(res.pages).toBe(3);
    expect(res.limit).toBe(10);
  });

  it('calcula el salto de registros según la página', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(3, 10);

    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(qb.take).toHaveBeenCalledWith(10);
  });

  it('recorta página y límite fuera de rango', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(0, 9999);

    expect(qb.skip).toHaveBeenCalledWith(0);
    // por encima de 100 por página se trunca a 100 (límite del DTO)
    expect(qb.take).toHaveBeenCalledWith(100);
  });

  it('sin resultados sigue devolviendo una estructura consistente', async () => {
    const { service } = crearServicio([], 0);

    const res = await service.findAllPaginado(5, 10);

    expect(res.data).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.page).toBe(5);
    expect(res.pages).toBe(0);
  });

  it('siempre hay al menos una página cuando hay registros', async () => {
    const { service } = crearServicio([{ id: 1 }], 1);

    const res = await service.findAllPaginado(1, 50);

    expect(res.pages).toBe(1);
  });
});

describe('UsuarioService.findAllPaginado — filtros', () => {
  beforeEach(() => jest.clearAllMocks());

  it('por defecto solo trae cuentas activas', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado();

    expect(qb.andWhere).toHaveBeenCalledWith('usuario.isActive = :isActive', {
      isActive: true,
    });
  });

  it('permite traer las inactivas', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(1, 10, undefined, undefined, 'inactive');

    expect(qb.andWhere).toHaveBeenCalledWith('usuario.isActive = :isActive', {
      isActive: false,
    });
  });

  it('filtra por rol cuando viene', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(1, 10, undefined, 'admin');

    expect(qb.andWhere).toHaveBeenCalledWith('usuario.role = :role', {
      role: 'admin',
    });
  });

  it('busca sin distinguir mayúsculas por nombre, email o teléfono', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(1, 10, 'AnA');

    const llamada = condicionDeBusqueda(qb);
    expect(llamada).toBeDefined();
    expect(llamada?.[0]).toContain('LOWER(usuario.email)');
    expect(llamada?.[0]).toContain('LOWER(usuario.telefono)');
    // el término se envuelve en %...% para el LIKE
    expect(llamada?.[1]).toEqual({ texto: '%AnA%' });
  });

  it('una búsqueda de solo espacios no filtra', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(1, 10, '   ');

    expect(condicionDeBusqueda(qb)).toBeUndefined();
  });

  it('la búsqueda se combina con el resto de filtros', async () => {
    const { service, qb } = crearServicio();

    await service.findAllPaginado(
      1,
      10,
      'ana',
      'user',
      'active',
      'nombre',
      'asc',
    );

    expect(qb.andWhere).toHaveBeenCalledTimes(3);
    expect(ultimaOrdenacion(qb)).toMatchObject({
      columna: 'usuario.nombre',
      direccion: 'ASC',
    });
  });
});
