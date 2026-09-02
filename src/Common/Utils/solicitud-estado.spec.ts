import {
  isEstadoPendiente,
  isEstadoArchivado,
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

  it('normaliza estados archivados y no los trata como pendientes', () => {
    expect(normalizarEstadoSolicitud('Archivado')).toBe('archivado');
    expect(normalizarEstadoSolicitud(' ARCHIVADA ')).toBe('archivado');
    expect(normalizarEstadoSolicitud('guardada')).toBe('archivado');
    expect(isEstadoArchivado('Archivado')).toBe(true);
    expect(isEstadoArchivado('Pendiente')).toBe(false);
  });

  it('evalúa correctamente si una solicitud está pendiente', () => {
    expect(isEstadoPendiente(' Pendiente ')).toBe(true);
    expect(isEstadoPendiente('RECHAZADO')).toBe(false);
    expect(isEstadoPendiente('Aprobado')).toBe(false);
    expect(isEstadoPendiente('Archivado')).toBe(false);
  });
});
