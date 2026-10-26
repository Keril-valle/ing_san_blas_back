import 'reflect-metadata';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { CatequesisBautismoController } from './catequesis-bautismo.controller';
import { CatequesisBautismoService } from './catequesis-bautismo.service';
import { InscripcionCatequesisBautismo } from './Entities/inscripcion-catequesis-bautismo.entity';

// Controlador, DTO y servicio reales. Repositorio en memoria: no usa la BD.
// La identidad se simula; estas pruebas NO cubren autenticación ni permisos.
describe('PUT /catequesis-bautismo/:id/estado', () => {
  let app: INestApplication;
  let fila: Record<string, unknown>;
  const repositorio = { findOneBy: jest.fn(), save: jest.fn() };
  const aprobacion = {
    estado: 'Aprobada',
    fechaInicioCatequesis: '2026-01-01',
    fechaFinalizacionCatequesis: '2026-02-01',
    responsableCertifica: 'María Pérez',
  };
  const rechazo = {
    estado: 'Rechazada', observacionAdministrativa: 'Datos incompletos',
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [CatequesisBautismoController],
      providers: [
        CatequesisBautismoService,
        { provide: getRepositoryToken(InscripcionCatequesisBautismo), useValue: repositorio },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.use((req: { user?: { sub: number } }, _res: unknown, next: () => void) => {
      req.user = { sub: 9 };
      next();
    });
    app.useGlobalPipes(new ValidationPipe({
      transform: true, whitelist: true, forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => { await app?.close(); });

  beforeEach(() => {
    jest.clearAllMocks();
    fila = {
      id: 7, estado: 'Pendiente', observacionAdministrativa: null,
      fechaActualizacionEstado: null, revisadoPor: null,
      fechaInicioCatequesis: null, fechaFinalizacionCatequesis: null,
      responsableCertifica: null,
    };
    repositorio.findOneBy.mockImplementation(async () => fila);
    repositorio.save.mockImplementation(async (entidad: Record<string, unknown>) => entidad);
  });

  const enviar = (datos: object, id: number | string = 7) =>
    request(app.getHttpServer()).put(`/catequesis-bautismo/${id}/estado`).send(datos);

  it('aprueba, responde 200 y guarda certificación, fecha y revisor', async () => {
    const antes = Date.now();
    const respuesta = await enviar(aprobacion).expect(200);
    expect(respuesta.body).toMatchObject({ ...aprobacion, id: 7, revisadoPor: 9 });
    expect(respuesta.body.observacionAdministrativa).toBeNull();
    const fecha = new Date(respuesta.body.fechaActualizacionEstado).getTime();
    expect(fecha).toBeGreaterThanOrEqual(antes);
    expect(fecha).toBeLessThanOrEqual(Date.now());
    expect(repositorio.findOneBy).toHaveBeenCalledWith({ id: 7 });
    expect(repositorio.save).toHaveBeenCalledTimes(1);
    expect(fila.fechaActualizacionEstado).toBeInstanceOf(Date);
  });

  it('rechaza, recorta el motivo y guarda auditoría sin exigir certificación', async () => {
    const respuesta = await enviar({ ...rechazo, observacionAdministrativa: '  Datos incompletos  ' }).expect(200);
    expect(respuesta.body).toMatchObject({ id: 7, estado: 'Rechazada', observacionAdministrativa: 'Datos incompletos', revisadoPor: 9 });
    expect(fila.fechaActualizacionEstado).toBeInstanceOf(Date);
    expect(fila.fechaInicioCatequesis).toBeNull();
    expect(fila.fechaFinalizacionCatequesis).toBeNull();
    expect(fila.responsableCertifica).toBeNull();
    expect(repositorio.save).toHaveBeenCalledTimes(1);
  });

  it.each([{}, { estado: 'Pendiente' }, { estado: 'Modificación solicitada' }, { estado: 'aprobada' }])(
    'responde 400 ante estado inválido: %j', async (datos) => {
      await enviar(datos).expect(400);
      expect(repositorio.findOneBy).not.toHaveBeenCalled();
      expect(repositorio.save).not.toHaveBeenCalled();
      expect(fila.estado).toBe('Pendiente');
    },
  );

  it.each([undefined, null, '', '    ', 'abcd', '  ab  ', 'x'.repeat(501)])(
    'responde 400 ante motivo inválido: %j', async (motivo) => {
      await enviar({ estado: 'Rechazada', observacionAdministrativa: motivo }).expect(400);
      expect(repositorio.findOneBy).not.toHaveBeenCalled();
      expect(repositorio.save).not.toHaveBeenCalled();
      expect(fila.estado).toBe('Pendiente');
    },
  );

  it('acepta exactamente cinco caracteres de motivo', async () => {
    await enviar({ ...rechazo, observacionAdministrativa: 'abcde' }).expect(200);
  });

  it('responde 404 cuando no existe y no guarda', async () => {
    repositorio.findOneBy.mockResolvedValueOnce(null);
    const respuesta = await enviar(rechazo, 999).expect(404);
    expect(respuesta.body.mensaje).toBe('La solicitud no existe.');
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  for (const estado of ['Aprobada', 'Rechazada']) {
    it.each([aprobacion, rechazo])(`responde 409 desde ${estado} hacia $estado sin alterar auditoría`, async (datos) => {
      fila.estado = estado;
      fila.fechaActualizacionEstado = new Date('2026-01-01T12:00:00Z');
      fila.revisadoPor = 5;
      const original = { ...fila };
      const respuesta = await enviar(datos).expect(409);
      expect(respuesta.body.mensaje).toContain('no puede modificarse');
      expect(fila).toEqual(original);
      expect(repositorio.save).not.toHaveBeenCalled();
    });
  }

  it('rechaza una segunda revisión de la misma solicitud', async () => {
    await enviar(rechazo).expect(200);
    await enviar(aprobacion).expect(409);
    expect(repositorio.save).toHaveBeenCalledTimes(1);
    expect(fila.estado).toBe('Rechazada');
  });

  it('responde 400 al aprobar sin certificación', async () => {
    await enviar({ estado: 'Aprobada' }).expect(400);
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('responde 400 si la finalización precede al inicio, sin alterar la solicitud', async () => {
    const original = { ...fila };
    await enviar({ ...aprobacion, fechaFinalizacionCatequesis: '2025-12-01' }).expect(400);
    expect(fila).toEqual(original);
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('responde 400 ante un id no numérico', async () => {
    await enviar(rechazo, 'invalido').expect(400);
    expect(repositorio.findOneBy).not.toHaveBeenCalled();
  });
});
