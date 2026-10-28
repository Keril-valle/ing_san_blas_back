// reflect-metadata hay que cargarlo antes que los decoradores de class-validator/transformer
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
} from './inscripcion-cica.dto';

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

const baseCica = {
  tipoCedula: 'nacional',
  cedula: '123456789',
  nombre: 'Ana',
  apellido1: 'Pérez',
  fechaNacimiento: '1990-01-01',
  nacionalidad: 'Costarricense',
  telefono: '8888-8888',
  correo: 'ana@dominio.com',
  estadoCivil: 'soltero',
  necesitaBautizo: true,
  necesitaPrimeraComunion: false,
  necesitaConfirmacion: false,
  padreNombre: 'Luis',
  padreApellido1: 'Pérez',
  madreNombre: 'Marta',
  madreApellido1: 'Gómez',
  provincia: 'Guanacaste',
  canton: 'Nicoya',
  distrito: 'Nicoya',
  direccionHogar: 'Calle 1 casa 2',
  esCatolico: true,
} as const;

const crearInscripcion = (datos: Record<string, unknown> = {}) =>
  plainToInstance(CrearInscripcionCicaDto, { ...baseCica, ...datos });

const erroresInscripcion = (datos: Record<string, unknown> = {}) =>
  validate(crearInscripcion(datos));

const errorInscripcion = async (
  datos: Record<string, unknown>,
  propiedad: string,
) => {
  const errores = await erroresInscripcion(datos);
  return errores.find((error) => error.property === propiedad);
};

describe('CrearInscripcionCicaDto: estado civil y cónyuge', () => {
  it.each(['soltero', 'matrimonio_civil', 'matrimonio_catolico', 'union_libre', 'union_civil', 'divorciado'])(
    'acepta el estado civil %s',
    async (estadoCivil) => {
      const conyuge = ['soltero', 'divorciado'].includes(estadoCivil)
        ? {}
        : { conyugeNombre: 'Luis', conyugeApellido1: 'Pérez' };
      await expect(
        erroresInscripcion({ estadoCivil, ...conyuge }),
      ).resolves.toHaveLength(0);
    },
  );

  it.each(['matrimonio_civil', 'matrimonio_catolico', 'union_libre', 'union_civil'])(
    'exige el cónyuge en %s',
    async (estadoCivil) => {
      const error = await errorInscripcion({ estadoCivil }, 'conyugeNombre');
      expect(error?.constraints?.isNotEmpty).toBe(
        'El nombre del cónyuge o compañero(a) es obligatorio.',
      );
    },
  );

  it.each(['soltero', 'divorciado'])(
    'permite el cónyuge vacío en %s',
    async (estadoCivil) => {
      await expect(
        erroresInscripcion({ estadoCivil, conyugeNombre: '   ' }),
      ).resolves.toHaveLength(0);
    },
  );

  it('exige al menos 3 caracteres en el cónyuge', async () => {
    const error = await errorInscripcion(
      { estadoCivil: 'union_civil', conyugeNombre: 'ab' },
      'conyugeNombre',
    );
    expect(error?.constraints?.minLength).toBe(
      'El nombre del cónyuge o compañero(a) debe tener al menos 3 caracteres.',
    );
  });

  it('acepta exactamente 3 caracteres en el cónyuge', async () => {
    await expect(
      erroresInscripcion({
        estadoCivil: 'union_libre',
        conyugeNombre: 'Ana',
        conyugeApellido1: 'Pérez',
      }),
    ).resolves.toHaveLength(0);
  });

  it('exige el primer apellido del cónyuge', async () => {
    const error = await errorInscripcion(
      { estadoCivil: 'matrimonio_civil', conyugeNombre: 'Luis' },
      'conyugeApellido1',
    );
    expect(error?.constraints?.isNotEmpty).toBe(
      'El primer apellido del cónyuge o compañero(a) es obligatorio.',
    );
  });

  it('no exige el segundo apellido del cónyuge', async () => {
    await expect(
      erroresInscripcion({
        estadoCivil: 'matrimonio_civil',
        conyugeNombre: 'Luis',
        conyugeApellido1: 'Pérez',
      }),
    ).resolves.toHaveLength(0);
  });

  it('convierte los apellidos vacíos del cónyuge en null', () => {
    const dto = crearInscripcion({
      estadoCivil: 'matrimonio_civil',
      conyugeNombre: 'Luis',
      conyugeApellido1: '   ',
      conyugeApellido2: '',
    });
    expect(dto.conyugeApellido1).toBeNull();
    expect(dto.conyugeApellido2).toBeNull();
  });
});
