import { normalizeDonacionEstado } from '../../Common/Utils/donacion-estado';

describe('normalizeDonacionEstado', () => {
  it('normalizes approved states', () => {
    expect(normalizeDonacionEstado('Aprobado')).toBe('Aprobado');
    expect(normalizeDonacionEstado('Aprobada')).toBe('Aprobado');
    expect(normalizeDonacionEstado('Aceptada')).toBe('Aprobado');
  });

  it('normalizes rejected states', () => {
    expect(normalizeDonacionEstado('Rechazado')).toBe('Rechazado');
    expect(normalizeDonacionEstado('Rechazada')).toBe('Rechazado');
    expect(normalizeDonacionEstado('Denegada')).toBe('Rechazado');
  });

  it('defaults unknown values to Pendiente', () => {
    expect(normalizeDonacionEstado('otro')).toBe('Pendiente');
  });
});
