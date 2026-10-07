import { ConflictException } from '@nestjs/common';
import {
  esEstadoFinalInscripcion,
  normalizarEstadoInscripcion,
  normalizarFilialInscripcion,
  normalizarNivelInscripcion,
  validarFechaNoFutura,
} from '../../Common/Utils/inscripcion-catequesis-validaciones';
import { CatequesisService } from './catequesis.service';

type RepositorioService = ConstructorParameters<typeof CatequesisService>[0];
type UsuarioService = ConstructorParameters<typeof CatequesisService>[1];

// arma el service con un repositorio simulado para probar updateEstado
const crearService = (estadoActual: string | null) => {
  const repositorioMock = {
    findOne: jest.fn().mockResolvedValue(
      estadoActual === null
        ? null
        : {
            id: 9,
            estado: estadoActual,
            catequizando: null,
            personaInscribe: null,
          },
    ),
    save: jest.fn(async (registro: Record<string, unknown>) => registro),
  };

  const service = new CatequesisService(
    repositorioMock as unknown as RepositorioService,
    {} as UsuarioService,
  );

  return { service, repositorioMock };
};

describe('inscripcion-catequesis-validaciones', () => {
  it('normalizes inscription states', () => {
    expect(normalizarEstadoInscripcion('pendiente')).toBe('Pendiente');
    expect(normalizarEstadoInscripcion('APROBADA')).toBe('Aprobada');
    expect(normalizarEstadoInscripcion('rechazada')).toBe('Rechazada');
    expect(normalizarEstadoInscripcion('otro')).toBeNull();
  });

  it('normalizes inscription levels', () => {
    expect(normalizarNivelInscripcion('primero')).toBe('Primero');
    expect(normalizarNivelInscripcion('setimo')).toBe('Sétimo');
    expect(normalizarNivelInscripcion('invalido')).toBeNull();
  });

  it('normalizes catechesis branches', () => {
    expect(normalizarFilialInscripcion('san blas')).toBe('San Blas');
    expect(normalizarFilialInscripcion('los angeles')).toBe('Los Ángeles');
    expect(normalizarFilialInscripcion('rio grande')).toBe('Río Grande');
    expect(normalizarFilialInscripcion('otra')).toBeNull();
  });

  it('validates non-future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);

    expect(validarFechaNoFutura(tomorrowIso)).toBe(false);
    expect(validarFechaNoFutura('2000-01-01')).toBe(true);
    expect(validarFechaNoFutura(null)).toBe(true);
  });

  it('detecta estados finales (solo Aprobada y Rechazada son terminales)', () => {
    expect(esEstadoFinalInscripcion('Aprobada')).toBe(true);
    expect(esEstadoFinalInscripcion('aprobada')).toBe(true);
    expect(esEstadoFinalInscripcion('Rechazada')).toBe(true);
    expect(esEstadoFinalInscripcion('Pendiente')).toBe(false);
    expect(esEstadoFinalInscripcion(null)).toBe(false);
    expect(esEstadoFinalInscripcion('otro estado')).toBe(false);
  });
});

describe('CatequesisService.updateEstado', () => {
  it('devuelve null cuando la solicitud no existe (el controller responde 404)', async () => {
    const { service } = crearService(null);

    await expect(service.updateEstado(99, 'Aprobada')).resolves.toBeNull();
  });

  it('responde 409 cuando la solicitud ya fue aprobada', async () => {
    const { service, repositorioMock } = crearService('Aprobada');

    await expect(
      service.updateEstado(9, 'Rechazada', 'querían cambiarlo', 1),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repositorioMock.save).not.toHaveBeenCalled();
  });

  it('responde 409 cuando la solicitud ya fue rechazada', async () => {
    const { service, repositorioMock } = crearService('Rechazada');

    await expect(service.updateEstado(9, 'Aprobada')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repositorioMock.save).not.toHaveBeenCalled();
  });

  it('aprueba una solicitud pendiente y registra la revisión', async () => {
    const { service, repositorioMock } = crearService('Pendiente');

    const respuesta = await service.updateEstado(9, 'Aprobada', undefined, 5);

    expect(respuesta?.estado).toBe('Aprobada');
    expect(repositorioMock.save).toHaveBeenCalledTimes(1);
    const guardado = repositorioMock.save.mock
      .calls[0][0] as Record<string, unknown>;
    expect(guardado.fechaActualizacionEstado).toBeInstanceOf(Date);
    expect(guardado.revisadoPor).toBe(5);
  });
});
