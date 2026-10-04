import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
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

describe('UsuarioController — el :id de la ruta usa ParseIntPipe', () => {
  let app: INestApplication;
  let servidor: Server;
  const findOne = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [{ provide: UsuarioService, useValue: { findOne } }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const crudo: unknown = app.getHttpServer();
    servidor = crudo as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockResolvedValue({ id: 5 });
  });

  it('rechaza un id no numérico con 400 sin llegar al service', async () => {
    await request(servidor).get('/usuario/abc').expect(400);

    expect(findOne).not.toHaveBeenCalled();
  });

  it('acepta un id numérico y se lo pasa como número', async () => {
    await request(servidor).get('/usuario/5').expect(200);

    expect(findOne).toHaveBeenCalledWith(5);
  });

  it('devuelve 404 cuando no existe un usuario activo con ese id', async () => {
    findOne.mockResolvedValue(null);

    await request(servidor).get('/usuario/5').expect(404);
  });
});
