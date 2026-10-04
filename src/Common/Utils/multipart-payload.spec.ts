import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  leerPayloadMultipart,
  parsearPayloadJson,
  validarPayloadMultipart,
} from './multipart-payload';

class PayloadEjemplo {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido.' })
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'La descripción no puede superar 10 letras.' })
  descripcion?: string;
}

const conPayload = (payload?: string): Request =>
  ({ body: payload === undefined ? {} : { Payload: payload } }) as Request;

const capturar = (promesa: Promise<unknown>): Promise<unknown> =>
  promesa.catch((error: unknown) => error);

const respuestaDe = (
  error: unknown,
): { mensaje: string; errores?: Record<string, string[]> } =>
  (error as BadRequestException).getResponse() as {
    mensaje: string;
    errores?: Record<string, string[]>;
  };

describe('parsearPayloadJson', () => {
  it('devuelve 400 con mensaje propio cuando el campo viene vacío', () => {
    expect(() =>
      parsearPayloadJson(undefined, { vacio: 'Faltan los datos.' }),
    ).toThrow(BadRequestException);

    try {
      parsearPayloadJson('   ', { vacio: 'Faltan los datos.' });
    } catch (error) {
      expect(respuestaDe(error).mensaje).toBe('Faltan los datos.');
    }
  });

  it('devuelve 400 cuando el JSON está roto', () => {
    try {
      parsearPayloadJson('{no es json', { invalido: 'JSON inválido.' });
      throw new Error('No debió parsear');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(respuestaDe(error).mensaje).toBe('JSON inválido.');
    }
  });
});

describe('leerPayloadMultipart', () => {
  it('valida el payload con el mismo criterio que el ValidationPipe global', async () => {
    const error = await capturar(
      leerPayloadMultipart(
        conPayload(JSON.stringify({ descripcion: 'ok' })),
        PayloadEjemplo,
        { vacio: 'Los datos son obligatorios.' },
      ),
    );

    expect(error).toBeInstanceOf(BadRequestException);
    const respuesta = respuestaDe(error);
    expect(respuesta.mensaje).toBe('El título es requerido.');
    expect(respuesta.errores?.titulo).toContain('El título es requerido.');
  });

  it('elimina los campos que no pertenecen al DTO (no se cuelan en la entidad)', async () => {
    const dto = await leerPayloadMultipart(
      conPayload(
        JSON.stringify({ titulo: 'Novena', id: 99, estado: 'Publicado' }),
      ),
      PayloadEjemplo,
    );

    expect(dto.titulo).toBe('Novena');
    expect(Object.keys(dto)).not.toContain('id');
    expect(Object.keys(dto)).not.toContain('estado');
    expect((dto as unknown as Record<string, unknown>).id).toBeUndefined();
  });

  it('aplica los límites de largo declarados en el DTO', async () => {
    const error = await capturar(
      leerPayloadMultipart(
        conPayload(
          JSON.stringify({ titulo: 'Novena', descripcion: 'x'.repeat(11) }),
        ),
        PayloadEjemplo,
      ),
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect(respuestaDe(error).errores?.descripcion).toEqual([
      'La descripción no puede superar 10 letras.',
    ]);
  });
});

describe('validarPayloadMultipart', () => {
  it('transforma los datos ya parseados en una instancia del DTO', async () => {
    const dto = await validarPayloadMultipart(
      { titulo: 'Retiro' },
      PayloadEjemplo,
    );

    expect(dto).toBeInstanceOf(PayloadEjemplo);
    expect(dto.titulo).toBe('Retiro');
    expect(dto.descripcion).toBeUndefined();
  });
});
