import {
  normalizarEstadoInscripcion,
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

  it('validates non-future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);

    expect(validarFechaNoFutura(tomorrowIso)).toBe(false);
    expect(validarFechaNoFutura('2000-01-01')).toBe(true);
    expect(validarFechaNoFutura(null)).toBe(true);
  });
});
