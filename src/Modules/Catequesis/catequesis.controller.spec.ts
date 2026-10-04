import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CatequesisController } from './catequesis.controller';
import { CatequesisService } from './catequesis.service';
import { CatequesisExportService } from './catequesis-export.service';
import { CatequesisFileStorageService } from './catequesis-file-storage.service';
import {
  CrearInscripcionCatequesisDto,
  ActualizarEstadoInscripcionDto,
} from './DTO/crear-inscripcion-catequesis.dto';
import { mapValidationErrors } from '../../Common/validation-errors';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

const crearController = (servicio: Record<string, unknown> = {}) =>
  new CatequesisController(
    {
      historial: jest.fn().mockResolvedValue({ total: 0, historial: [] }),
      ...servicio,
    } as unknown as CatequesisService,
    {} as CatequesisExportService,
    {} as CatequesisFileStorageService,
  );

const expectMensaje = async (promesa: Promise<unknown>, mensaje: string) => {
  const error = await promesa.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  expect((error as BadRequestException).getResponse()).toEqual({ mensaje });
};

const expectNoEncontrado = async (
  promesa: Promise<unknown>,
  mensaje: string,
) => {
  const error = await promesa.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(NotFoundException);
  expect((error as NotFoundException).getResponse()).toEqual({ mensaje });
};

describe('CatequesisController (validaciones del historial)', () => {
  it('rechaza fechas con formato inválido', async () => {
    const controller = crearController();

    await expectMensaje(
      controller.historial(undefined, undefined, '2026-13-45', undefined),
      'El formato de fecha no es válido, usá YYYY-MM-DD',
    );
    await expectMensaje(
      controller.historial(undefined, undefined, undefined, 'no-fecha'),
      'El formato de fecha no es válido, usá YYYY-MM-DD',
    );
  });

  it('rechaza rango invertido y estados desconocidos', async () => {
    const controller = crearController();

    await expectMensaje(
      controller.historial(undefined, undefined, '2026-10-10', '2026-10-01'),
      'La fecha de inicio no puede ser mayor que la fecha de fin',
    );
    await expectMensaje(
      controller.historial('otro', undefined, undefined, undefined),
      'El estado ingresado no es válido. Usá aprobado o rechazado',
    );
  });

  it('acepta filtros válidos y los delega al servicio', async () => {
    const historial = jest.fn().mockResolvedValue({ total: 0, historial: [] });
    const controller = crearController({ historial });

    await controller.historial(
      ' Aprobada ',
      '  Ana ',
      '2026-10-01',
      '2026-10-31',
    );

    expect(historial).toHaveBeenCalledWith({
      estado: 'Aprobada',
      encargado: 'Ana',
      desde: '2026-10-01',
      hasta: '2026-10-31',
    });
  });
});

describe('CatequesisController.createWithFiles', () => {
  const archivo = (nombre: string) =>
    ({
      originalname: nombre,
      buffer: Buffer.from('contenido'),
      size: 10,
      mimetype: nombre.endsWith('.pdf') ? 'application/pdf' : 'image/png',
    }) as Express.Multer.File;

  const archivos = () => ({
    FeBautismoArchivo: [archivo('fe-bautismo.pdf')],
    ComprobanteArchivo: [archivo('comprobante.png')],
  });

  const payloadValido = () =>
    JSON.stringify({
      datosInscripcion: {
        centroCatequesis: 'San Blas',
        nivelAInscribirse: 'Primero',
      },
      datosCatequizando: {
        nombre: 'Ana',
        primerApellido: 'Vargas',
        fechaNacimiento: '2014-05-10',
        direccionExacta: 'Calle 1, San José',
      },
      datosAdecuacion: { requiereAdecuacionCentroEducativo: false },
      datosCondicionSalud: { portadorEnfermedadCronica: false },
      datosPersonaInscribe: {
        nombre: 'Lucía',
        primerApellido: 'Vargas',
        parentesco: 'Madre',
        telefono: '88888888',
      },
      datosPago: { metodoPago: 'SINPE', numeroComprobanteSinpe: '12345' },
    });

  const crearConArchivos = (
    servicio: Record<string, unknown>,
    storage: Record<string, unknown>,
  ) =>
    new CatequesisController(
      servicio as unknown as CatequesisService,
      {} as CatequesisExportService,
      storage as unknown as CatequesisFileStorageService,
    );

  it('si el payload es inválido no sube ningún archivo (no quedan huérfanos)', async () => {
    const subir = jest.fn().mockResolvedValue('https://cdn/archivo');
    const create = jest.fn();
    const controller = crearConArchivos(
      { create },
      { saveCatequesisFile: subir },
    );

    const payload = payloadValido().replace('Primero', 'Segundo');

    const error = await controller
      .createWithFiles(payload, archivos())
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    const respuesta = (
      error as BadRequestException
    ).getResponse() as unknown as {
      errores: Record<string, string[]>;
    };
    expect(
      respuesta.errores['datosInscripcion.nivelAInscribirse'],
    ).toHaveLength(1);
    expect(subir).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('si faltan archivos responde 400 sin validar ni subir', async () => {
    const subir = jest.fn();
    const create = jest.fn();
    const controller = crearConArchivos(
      { create },
      { saveCatequesisFile: subir },
    );

    await expectMensaje(
      controller.createWithFiles(payloadValido(), {
        FeBautismoArchivo: [archivo('fe-bautismo.pdf')],
      }),
      'El comprobante de pago es obligatorio.',
    );

    expect(subir).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('si falta una sección del payload responde 400 en español sin subir', async () => {
    const subir = jest.fn();
    const create = jest.fn();
    const controller = crearConArchivos(
      { create },
      { saveCatequesisFile: subir },
    );

    await expectMensaje(
      controller.createWithFiles(JSON.stringify({}), archivos()),
      'Faltan los datos de la inscripción.',
    );

    expect(subir).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('con payload válido sube los dos archivos y guarda las URLs reales', async () => {
    const subir = jest
      .fn()
      .mockResolvedValueOnce('https://cdn/fe')
      .mockResolvedValueOnce('https://cdn/comprobante');

    let dtoCreado: CrearInscripcionCatequesisDto | undefined;
    const create = jest.fn((dto: CrearInscripcionCatequesisDto) => {
      dtoCreado = dto;
      return Promise.resolve({ id: 1 });
    });

    const controller = crearConArchivos(
      { create },
      { saveCatequesisFile: subir },
    );

    await controller.createWithFiles(payloadValido(), archivos());

    expect(subir).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(1);
    expect(dtoCreado?.datosInscripcion.feBautismoArchivo).toBe(
      'https://cdn/fe',
    );
    expect(dtoCreado?.datosPago.comprobanteArchivo).toBe(
      'https://cdn/comprobante',
    );
  });
});

describe('ActualizarEstadoInscripcionDto (pipe global)', () => {
  const validar = async (entrada: unknown) => {
    const dto = plainToInstance(ActualizarEstadoInscripcionDto, entrada);
    return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  };

  it('exige observación al rechazar', async () => {
    const errores = await validar({ estado: 'Rechazada', observacion: null });
    const respuesta = mapValidationErrors(errores);

    expect(respuesta.errores.observacion).toBeDefined();
    expect(typeof respuesta.mensaje).toBe('string');
  });

  it('acepta un rechazo con observación y un estado aprobado sin ella', async () => {
    await expect(
      validar({ estado: 'Rechazada', observacion: 'Falta documentación' }),
    ).resolves.toHaveLength(0);

    await expect(
      validar({ estado: 'Aprobada', observacion: null }),
    ).resolves.toHaveLength(0);
  });

  it('rechaza estados fuera del catálogo y campos extra', async () => {
    await expect(validar({ estado: 'rechazado' })).resolves.toHaveLength(1);
    await expect(
      validar({ estado: 'Aprobada', extra: 1 }),
    ).resolves.toHaveLength(1);
  });
});

describe('CatequesisController.updateEstado', () => {
  it('propaga los errores del servicio sin re-envolverlos', async () => {
    const controller = crearController({
      updateEstado: jest
        .fn()
        .mockRejectedValue(
          new BadRequestException({ mensaje: 'Estado inválido' }),
        ),
    });

    await expectMensaje(
      controller.updateEstado(1, { estado: 'Aprobada' }, {
        user: { sub: 7 },
      } as RequestWithUser),
      'Estado inválido',
    );
  });

  it('devuelve 404 cuando la inscripción no existe', async () => {
    const controller = crearController({
      updateEstado: jest.fn().mockResolvedValue(null),
    });

    await expectNoEncontrado(
      controller.updateEstado(99, { estado: 'Aprobada' }, {
        user: { sub: 7 },
      } as RequestWithUser),
      'No se encontró una inscripción con el id indicado.',
    );
  });
});
