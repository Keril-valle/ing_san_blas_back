import {
  isEstadoPendiente,
  normalizarEstadoSolicitud,
} from './estado-solicitud';

describe('normalizarEstadoSolicitud', () => {
  it('normaliza estados pendientes sin importar mayúsculas o espacios', () => {
    expect(normalizarEstadoSolicitud(' Pendiente ')).toBe('pendiente');
    expect(normalizarEstadoSolicitud('PENDIENTE')).toBe('pendiente');
    expect(normalizarEstadoSolicitud('  pendiente  ')).toBe('pendiente');
  });

  it('normaliza estados rechazados con variaciones de nombre', () => {
    expect(normalizarEstadoSolicitud('Rechazado')).toBe('rechazado');
    expect(normalizarEstadoSolicitud(' RECHAZADA ')).toBe('rechazado');
    expect(normalizarEstadoSolicitud('Aprobado')).toBe('aprobado');
  });

  it('evalúa correctamente si una solicitud está pendiente', () => {
    expect(isEstadoPendiente(' Pendiente ')).toBe(true);
    expect(isEstadoPendiente('RECHAZADO')).toBe(false);
    expect(isEstadoPendiente('Aprobado')).toBe(false);
  });
});
