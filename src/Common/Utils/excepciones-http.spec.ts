import { BadRequestException, HttpException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { rethrowComoBadRequest } from './excepciones-http';

const capturar = (error: unknown, porDefecto?: string): unknown => {
  try {
    rethrowComoBadRequest(error, porDefecto);
    return 'no lanzó';
  } catch (e) {
    return e;
  }
};

describe('rethrowComoBadRequest', () => {
  it('convierte un Error plano en 400 conservando su mensaje de negocio', () => {
    const resultado = capturar(
      new Error('La filial no corresponde a un centro de catequesis válido.'),
    );

    expect(resultado).toBeInstanceOf(BadRequestException);
    expect((resultado as BadRequestException).getResponse()).toEqual({
      mensaje: 'La filial no corresponde a un centro de catequesis válido.',
    });
  });

  it('un error técnico de JavaScript no llega al usuario', () => {
    const resultado = capturar(
      new TypeError(
        "Cannot read properties of undefined (reading 'datosPago')",
      ),
    );

    expect(resultado).toBeInstanceOf(BadRequestException);
    const cuerpo = (resultado as BadRequestException).getResponse() as {
      mensaje: string;
    };
    expect(cuerpo.mensaje).toBe('No se pudo procesar la solicitud.');
    expect(cuerpo.mensaje).not.toMatch(/cannot read|undefined/i);
  });

  it('usa el mensaje por defecto del controlador cuando el error es técnico', () => {
    const resultado = capturar(
      new TypeError('x is not a function'),
      'No se pudo crear la donación',
    );

    expect((resultado as BadRequestException).getResponse()).toEqual({
      mensaje: 'No se pudo crear la donación',
    });
  });

  it('una HttpException existente se relanza tal cual', () => {
    const original = new BadRequestException({ mensaje: 'Dato repetido.' });

    expect(capturar(original)).toBe(original);
  });

  it('un fallo de base de datos se relanza para que el filtro responda 503', () => {
    const fallo = new QueryFailedError(
      'SELECT * FROM "InscripcionesCatequesis"',
      [],
      new Error('boom'),
    );

    expect(capturar(fallo)).toBe(fallo);
  });

  it('un error sin mensaje usa el texto por defecto', () => {
    const resultado = capturar(new Error(''));

    expect((resultado as BadRequestException).getResponse()).toEqual({
      mensaje: 'No se pudo procesar la solicitud.',
    });
  });

  it('un valor que no es Error tampoco expone detalles', () => {
    const resultado = capturar('fallo raro sin envoltorio');

    expect(resultado).toBeInstanceOf(HttpException);
    expect((resultado as BadRequestException).getResponse()).toEqual({
      mensaje: 'No se pudo procesar la solicitud.',
    });
  });
});
