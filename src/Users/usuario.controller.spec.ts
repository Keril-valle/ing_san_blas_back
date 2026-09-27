import { UsuarioController } from './usuario.controller';
import { BuscarUsuariosDto } from './DTO/buscar-usuarios.dto';

const crearServiceMock = () => ({
  findAll: jest.fn(() => 'lista-completa'),
  findAllPaginado: jest.fn(() => 'paginada'),
});

const dto = (entrada: Partial<BuscarUsuariosDto> = {}) =>
  entrada as BuscarUsuariosDto;

describe('UsuarioController.findAll — rutas de ordenamiento', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sin query params devuelve la lista completa (compatibilidad)', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    const respuesta = controller.findAll(dto());

    expect(respuesta).toBe('lista-completa');
    expect(service.findAllPaginado).not.toHaveBeenCalled();
  });

  it('con page/limit va a la versión paginada', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    void controller.findAll(dto({ page: 2, limit: 25 }));

    expect(service.findAll).not.toHaveBeenCalled();
    expect(service.findAllPaginado).toHaveBeenCalledWith(
      2,
      25,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('solo con sortBy ya no devuelve la lista completa', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    void controller.findAll(dto({ sortBy: 'nombre' }));

    expect(service.findAll).not.toHaveBeenCalled();
    // page/limit sin definir los defaultea el service (1 y 10), el controller solo reenvía
    expect(service.findAllPaginado).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'nombre',
      undefined,
    );
  });

  it('solo con sortDirection también va a la paginada', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    void controller.findAll(dto({ sortDirection: 'asc' }));

    expect(service.findAll).not.toHaveBeenCalled();
    expect(service.findAllPaginado).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'asc',
    );
  });

  it('reenvía los dos parámetros de orden en su posición correcta', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    void controller.findAll(
      dto({
        page: 3,
        limit: 50,
        search: 'ana',
        role: 'user',
        state: 'active',
        sortBy: 'email',
        sortDirection: 'desc',
      }),
    );

    expect(service.findAllPaginado).toHaveBeenCalledWith(
      3,
      50,
      'ana',
      'user',
      'active',
      'email',
      'desc',
    );
  });

  it('los parámetros de orden no se pierden junto a los filtros', () => {
    const service = crearServiceMock();
    const controller = new UsuarioController(service as never);

    void controller.findAll(dto({ page: 1, role: 'admin', sortBy: 'state' }));

    expect(service.findAllPaginado).toHaveBeenCalledWith(
      1,
      undefined,
      undefined,
      'admin',
      undefined,
      'state',
      undefined,
    );
  });
});
