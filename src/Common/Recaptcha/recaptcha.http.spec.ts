import 'reflect-metadata';
import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DonacionesController } from '../../Modules/Donaciones/donaciones.controller';
import { DonacionesService } from '../../Modules/Donaciones/donaciones.service';
import { SolicSacramentoController } from '../../Modules/Solicitudes/solic-sacramento.controller';
import { SolicSacramentoService } from '../../Modules/Solicitudes/solic-sacramento.service';
import { GlobalExceptionFilter } from '../Filters/global-exception.filter';
import { RecaptchaService } from './recaptcha.service';

describe('reCAPTCHA en formularios públicos (HTTP)', () => {
  let app: INestApplication;
  let fetchMock: jest.SpyInstance;
  const donaciones = { create: jest.fn(async () => ({ id: 1 })) };
  const solicitudes = {
    create: jest.fn(async () => ({ id: 2 })),
    createWithImage: jest.fn(async () => ({ id: 3 })),
  };
  const datosDonacion = {
    anonimo: false,
    nombre: 'Persona de prueba',
    correo: 'prueba@example.com',
    detalle: 'Insumos de prueba',
  };
  const datosSolicitud = {
    PrimerNombre: 'Persona',
    PrimerApellido: 'Prueba',
    SegundoApellido: 'Prueba',
    Cedula: 123456789,
    Correo: 'prueba@example.com',
    Telefono: 88888888,
    Parroquia: 'San Blas',
    Motivo: 'Constancia de prueba',
  };

  // Arranca solo controladores y verificación; no usa base de datos, correo ni Cloudinary.
  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const modulo = await Test.createTestingModule({
      controllers: [DonacionesController, SolicSacramentoController],
      providers: [
        RecaptchaService,
        {
          provide: ConfigService,
          useValue: {
            get: (clave: string) =>
              ({
                RECAPTCHA_SECRET_KEY: 'clave-ficticia-para-pruebas',
                FRONTEND_URL: 'https://parroquiasanblas.org',
              })[clave],
          },
        },
        { provide: DonacionesService, useValue: donaciones },
        { provide: SolicSacramentoService, useValue: solicitudes },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  // Cada caso arranca con un proveedor simulado y ninguna operación de guardado previa.
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          hostname: 'parroquiasanblas.org',
        }),
      ),
    );
  });
  afterEach(() => fetchMock.mockRestore());
  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  describe.each(['donacion', 'solicitud', 'multipart'])('%s', (tipo) => {
    // Construye los tres contratos reales, incluido Payload y un comprobante adjunto.
    const enviar = (token?: unknown) => {
      const captcha = token === undefined ? {} : { recaptchaToken: token };
      if (tipo === 'donacion')
        return request(app.getHttpServer())
          .post('/Donacion')
          .send({ ...datosDonacion, ...captcha });
      if (tipo === 'solicitud')
        return request(app.getHttpServer())
          .post('/solic-sacramento')
          .send({ ...datosSolicitud, ...captcha });
      return request(app.getHttpServer())
        .post('/solic-sacramento/con-imagen')
        .field('Payload', JSON.stringify({ ...datosSolicitud, ...captcha }))
        .attach('archivo', Buffer.from('comprobante simulado'), 'prueba.png');
    };

    it.each([undefined, '', '   '])(
      'sin token válido no guarda ni sube archivos (%p)',
      async (token) => {
        await enviar(token).expect(400);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(donaciones.create).not.toHaveBeenCalled();
        expect(solicitudes.create).not.toHaveBeenCalled();
        expect(solicitudes.createWithImage).not.toHaveBeenCalled();
      },
    );

    it.each(['invalid-input-response', 'timeout-or-duplicate'])(
      'rechaza el token %s antes del guardado',
      async (codigo) => {
        fetchMock.mockResolvedValueOnce(
          new Response(
            JSON.stringify({ success: false, 'error-codes': [codigo] }),
          ),
        );
        await enviar('token-rechazado').expect(400);
        expect(donaciones.create).not.toHaveBeenCalled();
        expect(solicitudes.create).not.toHaveBeenCalled();
        expect(solicitudes.createWithImage).not.toHaveBeenCalled();
      },
    );

    it('una caída de Google devuelve 503 y no permite guardar', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Proveedor caído'));
      await enviar('token-de-prueba').expect(503);
      expect(donaciones.create).not.toHaveBeenCalled();
      expect(solicitudes.create).not.toHaveBeenCalled();
      expect(solicitudes.createWithImage).not.toHaveBeenCalled();
    });

    it('un token válido permite crear sin pasar el token a persistencia', async () => {
      const res = await enviar('token-de-prueba').expect(201);
      const crear =
        tipo === 'donacion'
          ? donaciones.create
          : tipo === 'solicitud'
            ? solicitudes.create
            : solicitudes.createWithImage;
      expect(crear).toHaveBeenCalledTimes(1);
      expect(crear.mock.calls[0][0]).not.toHaveProperty('recaptchaToken');
      expect(res.body).not.toHaveProperty('recaptchaToken');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each(['null', '[]', 'mal-json'])(
    'rechaza Payload mal formado sin consultar Google (%s)',
    async (payload) => {
      await request(app.getHttpServer())
        .post('/solic-sacramento/con-imagen')
        .field('Payload', payload)
        .expect(400);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(solicitudes.createWithImage).not.toHaveBeenCalled();
    },
  );
});
