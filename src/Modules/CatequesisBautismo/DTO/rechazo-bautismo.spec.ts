import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarEstadoCatequesisBautismoDto } from './inscripcion-catequesis-bautismo.dto';

describe('Motivo de rechazo de bautismo', () => {
  it.each([undefined, '', '   ', 'abcd', '  ab  '])('rechaza motivo inválido %s', async (motivo) => {
    const dto = plainToInstance(ActualizarEstadoCatequesisBautismoDto, {
      estado: 'Rechazada', observacionAdministrativa: motivo,
    });
    const errores = await validate(dto);
    expect(errores.some((e) => e.property === 'observacionAdministrativa')).toBe(true);
  });

  it.each(['abcde', '  Motivo válido  ', 'x'.repeat(500)])('acepta un motivo válido de longitud %s', async (motivo) => {
    const dto = plainToInstance(ActualizarEstadoCatequesisBautismoDto, {
      estado: 'Rechazada', observacionAdministrativa: motivo,
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto.observacionAdministrativa).toBe(motivo.trim());
  });

  it('rechaza más de 500 caracteres', async () => {
    const dto = plainToInstance(ActualizarEstadoCatequesisBautismoDto, {
      estado: 'Rechazada', observacionAdministrativa: 'x'.repeat(501),
    });
    const errores = await validate(dto);
    expect(errores.find((e) => e.property === 'observacionAdministrativa')?.constraints?.maxLength).toBeDefined();
  });
});
