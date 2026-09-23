import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BuscarUsuariosDto } from './buscar-usuarios.dto';

// valida igual que hace el controller en runtime (whitelist, sin romper con extras)
const validar = async (entrada: Record<string, unknown>) => {
  const dto = plainToInstance(BuscarUsuariosDto, entrada, {
    enableImplicitConversion: true,
  });
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  return { dto, errores };
};

describe('BuscarUsuariosDto — ordenamiento', () => {
  it('acepta las columnas y direcciones permitidas', async () => {
    const { errores } = await validar({
      sortBy: 'nombre',
      sortDirection: 'asc',
    });
    expect(errores).toHaveLength(0);

    const columnas = [
      'nombre',
      'email',
      'telefono',
      'role',
      'state',
      'createdAt',
    ];
    for (const campo of columnas) {
      const { errores: porCampo } = await validar({ sortBy: campo });
      expect(porCampo).toHaveLength(0);
    }
  });

  it('rechaza cualquier columna fuera de la whitelist', async () => {
    // acá está lo importante: un string del cliente nunca llega a orderBy
    const { errores } = await validar({
      sortBy: 'password',
      sortDirection: 'asc',
    });
    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('sortBy');
    expect(errores[0].constraints?.isIn).toBe(
      'El campo de ordenamiento no es válido',
    );
  });

  it('rechaza un intento de inyección en sortBy', async () => {
    const { errores } = await validar({
      sortBy: 'usuario.nombre); DROP TABLE usuario; --',
    });
    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('sortBy');
  });

  it('rechaza direcciones distintas de asc/desc', async () => {
    for (const direccion of ['ASC', 'DESC', 'up', 'down', '']) {
      const { errores } = await validar({ sortDirection: direccion });
      expect(errores).toHaveLength(1);
      expect(errores[0].property).toBe('sortDirection');
      expect(errores[0].constraints?.isIn).toBe(
        'La dirección de ordenamiento debe ser asc o desc',
      );
    }
  });

  it('rechaza sortBy sin valor (cadena vacía no está en la whitelist)', async () => {
    const { errores } = await validar({ sortBy: '' });
    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('sortBy');
  });

  it('todo es opcional: un dto vacío pasa la validación', async () => {
    const { dto, errores } = await validar({});
    expect(errores).toHaveLength(0);
    expect(dto.sortBy).toBeUndefined();
    expect(dto.sortDirection).toBeUndefined();
    expect(dto.page).toBeUndefined();
    expect(dto.search).toBeUndefined();
  });

  it('respeta los límites de paginación', async () => {
    const { errores: paginaCero } = await validar({ page: 0 });
    expect(paginaCero).toHaveLength(1);
    expect(paginaCero[0].property).toBe('page');

    const { errores: limiteGigante } = await validar({ limit: 999 });
    expect(limiteGigante).toHaveLength(1);
    expect(limiteGigante[0].property).toBe('limit');

    const { errores: valido } = await validar({ page: 3, limit: 100 });
    expect(valido).toHaveLength(0);
  });

  it('descarta campos desconocidos en vez de rechazarlos', async () => {
    const { dto, errores } = await validar({
      sortBy: 'nombre',
      paranoide: 'no',
      sinpe: '8888-1234',
    });
    expect(errores).toHaveLength(0);
    expect(
      (dto as unknown as Record<string, unknown>).paranoide,
    ).toBeUndefined();
    expect((dto as unknown as Record<string, unknown>).sinpe).toBeUndefined();
    expect(dto.sortBy).toBe('nombre');
  });

  it('valida también búsqueda, rol y estado', async () => {
    const { errores } = await validar({
      search: 'ana',
      role: 'admin',
      state: 'active',
    });
    expect(errores).toHaveLength(0);

    const { errores: estadoMalo } = await validar({ state: 'borrado' });
    expect(estadoMalo).toHaveLength(1);
    expect(estadoMalo[0].property).toBe('state');

    const { errores: searchLargo } = await validar({ search: 'x'.repeat(151) });
    expect(searchLargo).toHaveLength(1);
    expect(searchLargo[0].property).toBe('search');
  });
});
