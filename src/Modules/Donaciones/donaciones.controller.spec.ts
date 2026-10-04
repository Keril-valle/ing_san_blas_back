import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DonacionesController } from './donaciones.controller';
import { DonacionesService } from './donaciones.service';

const crearController = (servicio: Record<string, unknown> = {}) =>
  new DonacionesController({
    historial: jest.fn().mockResolvedValue({ total: 0, historial: [] }),
    create: jest.fn(),
    ...servicio,
  } as unknown as DonacionesService);

const capturar = (promesa: Promise<unknown>): Promise<unknown> =>
  promesa.catch((error: unknown) => error);

const mensajeDe = (error: unknown): string => {
  const respuesta = (error as { getResponse?: () => unknown }).getResponse?.();

  if (typeof respuesta === 'string') return respuesta;

  const objeto = respuesta as { mensaje?: string; message?: string } | null;
  return objeto?.mensaje ?? objeto?.message ?? '';
};

describe('DonacionesController.historial', () => {
  it('valida el formato de fechas y el rango', async () => {
    const controller = crearController();

    const formatoInvalido = await capturar(
      controller.historial(undefined, '10/10/2026', undefined),
    );
    expect(formatoInvalido).toBeInstanceOf(BadRequestException);
    expect(mensajeDe(formatoInvalido)).toBe(
      'El formato de fecha no es válido, usá YYYY-MM-DD',
    );

    const rangoInvertido = await capturar(
      controller.historial(undefined, '2026-10-10', '2026-10-01'),
    );
    expect(rangoInvertido).toBeInstanceOf(BadRequestException);
    expect(mensajeDe(rangoInvertido)).toBe(
      'La fecha de inicio no puede ser mayor que la fecha de fin',
    );
  });

  it('valida el estado y delega los filtros válidos', async () => {
    const historial = jest.fn().mockResolvedValue({ total: 0, historial: [] });
    const controller = crearController({ historial });

    const estadoInvalido = await capturar(
      controller.historial('otro', undefined, undefined),
    );
    expect(estadoInvalido).toBeInstanceOf(BadRequestException);
    expect(mensajeDe(estadoInvalido)).toBe(
      'El estado ingresado no es válido. Usá aprobado o rechazado',
    );

    await controller.historial(' Aprobado ', '2026-10-01', '2026-10-31');

    expect(historial).toHaveBeenCalledWith({
      estado: 'Aprobado',
      desde: '2026-10-01',
      hasta: '2026-10-31',
    });
  });
});

describe('DonacionesController.create', () => {
  const bodyValido = {
    anonimo: false,
    nombre: 'Ana Perez',
    correo: 'ana@correo.com',
    detalle: 'Donacion de alimentos',
  };

  it('responde 400 con el detalle de errores de validación', async () => {
    const controller = crearController();

    const error = await capturar(
      controller.create({ ...bodyValido, correo: 'no-es-correo' }),
    );

    expect(error).toBeInstanceOf(BadRequestException);
    const respuesta = (error as BadRequestException).getResponse() as {
      mensaje: string;
      errores: Record<string, string[]>;
    };
    expect(respuesta.errores.correo).toHaveLength(1);
    expect(respuesta.mensaje).toBe(respuesta.errores.correo[0]);
  });

  it('propaga los errores HTTP del servicio tal cual', async () => {
    const controller = crearController({
      create: jest
        .fn()
        .mockRejectedValue(
          new NotFoundException('No se encontró el donativo.'),
        ),
    });

    const error = await capturar(controller.create(bodyValido));
    expect(error).toBeInstanceOf(NotFoundException);
    expect(mensajeDe(error)).toBe('No se encontró el donativo.');
  });

  it('convierte los errores desconocidos en 400 con su mensaje', async () => {
    const controller = crearController({
      create: jest.fn().mockRejectedValue(new Error('Campos incompletos')),
    });

    const error = await capturar(controller.create(bodyValido));
    expect(error).toBeInstanceOf(BadRequestException);
    expect(mensajeDe(error)).toBe('Campos incompletos');

    const sinMensaje = crearController({
      create: jest.fn().mockRejectedValue('fallo'),
    });
    const errorPorDefecto = await capturar(sinMensaje.create(bodyValido));
    expect(errorPorDefecto).toBeInstanceOf(BadRequestException);
    expect(mensajeDe(errorPorDefecto)).toBe('No se pudo crear la donación');
  });
});

describe('DonacionesController.updateEstado', () => {
  it('responde 500 amigable ante fallos no previstos', async () => {
    const controller = crearController({
      updateEstado: jest.fn().mockRejectedValue(new Error('boom')),
    });

    const error = await capturar(
      controller.updateEstado(1, { estado: 'Aprobado' }),
    );
    expect(error).toBeInstanceOf(InternalServerErrorException);
    expect(mensajeDe(error)).toBe(
      'Ocurrió un error al actualizar el estado del donativo.',
    );
  });
});
