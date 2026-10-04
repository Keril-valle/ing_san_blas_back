import { CatequesisService } from './catequesis.service';
import type { AvisoInscripcionCatequesis } from '../../Notifications/Services/catequesis-mail.service';
import {
  normalizarEstadoInscripcion,
  normalizarFilialInscripcion,
  normalizarNivelInscripcion,
  validarFechaNoFutura,
} from '../../Common/Utils/inscripcion-catequesis-validaciones';

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
});

describe('CatequesisService.updateEstado', () => {
  const inscripcionDePrueba = () => ({
    id: 7,
    estado: 'Pendiente',
    centroCatequesis: 'San Blas',
    nivelAInscribirse: 'Primero',
    observacionAdministrativa: null,
    fechaActualizacionEstado: null,
    revisadoPor: null,
    catequizando: { nombre: 'Ana', primerApellido: 'Vargas' },
    personaInscribe: {
      nombre: 'Lucía',
      primerApellido: 'Vargas',
      correo: 'madre@correo.com',
    },
  });

  it('responde aunque el correo nunca termine (no bloquea el panel)', async () => {
    const inscripcion = inscripcionDePrueba();
    const guardar = jest.fn((dato: typeof inscripcion) =>
      Promise.resolve(dato),
    );
    let avisoRecibido: AvisoInscripcionCatequesis | undefined;
    const notificar = jest.fn((aviso: AvisoInscripcionCatequesis) => {
      avisoRecibido = aviso;
      return new Promise<never>(() => undefined);
    });

    const service = new CatequesisService(
      {
        findOne: jest.fn().mockResolvedValue(inscripcion),
        save: guardar,
      } as never,
      {} as never,
      { notificarEstado: notificar } as never,
    );

    // Si el servicio volviera a esperar el correo, esta promesa nunca
    // resolvería y la prueba fallaría por tiempo de espera agotado.
    const respuesta = await service.updateEstado(7, 'Aprobada', undefined, 3);

    expect(respuesta?.estado).toBe('Aprobada');
    expect(respuesta?.fechaActualizacionEstado).toBeInstanceOf(Date);
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(notificar).toHaveBeenCalledTimes(1);
    expect(avisoRecibido).toMatchObject({
      id: 7,
      estado: 'Aprobada',
      correo: 'madre@correo.com',
    });
  });

  it('devuelve null cuando la inscripción no existe', async () => {
    const service = new CatequesisService(
      { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() } as never,
      {} as never,
      { notificarEstado: jest.fn() } as never,
    );

    await expect(service.updateEstado(99, 'Aprobada')).resolves.toBeNull();
  });
});
