import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import { validarUbicacionCostaRica } from './ubicacion-costa-rica';
import { guardarMatricula } from './guardar-matricula';
import { ListarCicaDto } from '../../Modules/Cica/DTO/listar-cica.dto';
import { ListarBautismoDto } from '../../Modules/CatequesisBautismo/DTO/listar-bautismo.dto';

describe('ubicación CICA', () => {
  it.each([
    ['Guanacaste', 'Nicoya', 'Nicoya'],
    ['Guanacaste', 'Nicoya', 'Samara'],
    ['San José', 'Central', 'Carmen'],
    ['Alajuela', 'Río Cuarto', 'Santa Rita'],
    ['Cartago', 'Paraíso', 'Birrisito'],
  ])('acepta %s / %s / %s', (provincia, canton, distrito) => {
    expect(() =>
      validarUbicacionCostaRica({ provincia, canton, distrito }),
    ).not.toThrow();
  });
  it.each([
    ['No existe', 'Nicoya', 'Nicoya'],
    ['Heredia', 'Nicoya', 'Nicoya'],
    ['Guanacaste', 'Nicoya', 'Liberia'],
    ['Guanacaste', 'Nicoya', ''],
  ])('rechaza %s / %s / %s', (provincia, canton, distrito) => {
    expect(() =>
      validarUbicacionCostaRica({ provincia, canton, distrito }),
    ).toThrow(BadRequestException);
  });
});

describe('DTO de listados', () => {
  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'texto' },
    { limit: '101' },
    { limit: '' },
    { vista: 'otra' },
    { estado: 'otro' },
    { sacramento: 'nombreColumna' },
    { busqueda: ['Ana'] },
  ])('rechaza parámetros inválidos %j', async (datos) => {
    expect(
      await validate(plainToInstance(ListarCicaDto, datos)),
    ).not.toHaveLength(0);
  });
  it('convierte números y recorta búsquedas', async () => {
    const dto = plainToInstance(ListarCicaDto, {
      page: '2',
      limit: '25',
      busqueda: ' Ana ',
      sacramento: 'bautizo',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, limit: 25, busqueda: 'Ana' });
  });
  it('valida el catálogo de condición', async () => {
    expect(
      await validate(
        plainToInstance(ListarBautismoDto, { condicion: 'inventada' }),
      ),
    ).not.toHaveLength(0);
    expect(
      await validate(
        plainToInstance(ListarBautismoDto, { condicion: 'padre_madre' }),
      ),
    ).toHaveLength(0);
  });
});

describe('duplicados', () => {
  it.each(['UQ_cica_cedula_pendiente', 'UQ_bautismo_cedula_pendiente'])(
    'devuelve 409 para %s',
    async (constraint) => {
      const error = new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicado'), { code: '23505', constraint }),
      );
      const repo = { save: jest.fn().mockRejectedValue(error) };
      await expect(
        guardarMatricula(
          repo as unknown as Repository<{ id: number }>,
          { id: 1 },
          constraint,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );
  it('no oculta errores de conexión ni otros índices', async () => {
    const error = new Error('conexión');
    const repo = { save: jest.fn().mockRejectedValue(error) };
    await expect(
      guardarMatricula(
        repo as unknown as Repository<{ id: number }>,
        { id: 1 },
        'indice',
      ),
    ).rejects.toBe(error);
  });
});
