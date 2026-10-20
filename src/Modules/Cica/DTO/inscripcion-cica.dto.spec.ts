// reflect-metadata hay que cargarlo antes que los decoradores de class-validator/transformer
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarEstadoCicaDto } from './inscripcion-cica.dto';

const crearDto = (datos: Partial<ActualizarEstadoCicaDto>) =>
  plainToInstance(ActualizarEstadoCicaDto, datos);

const erroresDe = (datos: Partial<ActualizarEstadoCicaDto>) =>
  validate(crearDto(datos));

const errorDe = async (
  datos: Partial<ActualizarEstadoCicaDto>,
  propiedad: string,
) => {
  const errores = await erroresDe(datos);
  return errores.find((error) => error.property === propiedad);
};

describe('ActualizarEstadoCicaDto', () => {
  it('acepta Aprobada sin observación', async () => {
    await expect(erroresDe({ estado: 'Aprobada' })).resolves.toHaveLength(0);
  });

  it('acepta Aprobada con observación (opcional)', async () => {
    await expect(
      erroresDe({
        estado: 'Aprobada',
        observacionAdministrativa: 'Todo en orden',
      }),
    ).resolves.toHaveLength(0);
  });

  it('acepta Rechazada con observación', async () => {
    await expect(
      erroresDe({
        estado: 'Rechazada',
        observacionAdministrativa: 'Datos incompletos',
      }),
    ).resolves.toHaveLength(0);
  });

  it('rechaza un estado distinto de Aprobada o Rechazada', async () => {
    const error = await errorDe(
      { estado: 'Pendiente' as 'Aprobada' },
      'estado',
    );
    expect(error?.constraints?.isIn).toBe(
      'El estado solo puede ser Aprobada o Rechazada.',
    );
  });

  it('rechaza cuando falta el estado', async () => {
    const error = await errorDe({}, 'estado');
    expect(error?.constraints?.isIn).toBe(
      'El estado solo puede ser Aprobada o Rechazada.',
    );
  });

  it('exige la observación al rechazar', async () => {
    const error = await errorDe(
      { estado: 'Rechazada' },
      'observacionAdministrativa',
    );
    expect(error?.constraints?.isNotEmpty).toBe(
      'La observación es obligatoria al rechazar la solicitud.',
    );
  });

  it('trata la observación vacía como faltante al rechazar', async () => {
    const error = await errorDe(
      { estado: 'Rechazada', observacionAdministrativa: '   ' },
      'observacionAdministrativa',
    );
    expect(error?.constraints?.isNotEmpty).toBe(
      'La observación es obligatoria al rechazar la solicitud.',
    );
  });

  it('rechaza una observación de más de 500 caracteres', async () => {
    const error = await errorDe(
      { estado: 'Rechazada', observacionAdministrativa: 'x'.repeat(501) },
      'observacionAdministrativa',
    );
    expect(error?.constraints?.maxLength).toContain('500');
  });

  it('recorta los espacios de la observación', () => {
    const dto = crearDto({
      estado: 'Rechazada',
      observacionAdministrativa: '  motivo  ',
    });
    expect(dto.observacionAdministrativa).toBe('motivo');
  });
});
