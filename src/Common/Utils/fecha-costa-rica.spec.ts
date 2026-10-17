import { fechaCostaRica } from './fecha-costa-rica';

const aFecha = (iso: string) => fechaCostaRica(new Date(iso));

describe('fechaCostaRica', () => {
  it('sigue en el mismo día a las 6 p. m. y a las 9 p. m. en Costa Rica', () => {
    expect(aFecha('2026-10-08T00:00:00.000Z')).toBe('2026-10-07');
    expect(aFecha('2026-10-08T03:00:00.000Z')).toBe('2026-10-07');
  });

  it('cambia de día a medianoche en Costa Rica', () => {
    expect(aFecha('2026-10-08T05:59:59.000Z')).toBe('2026-10-07');
    expect(aFecha('2026-10-08T06:00:00.000Z')).toBe('2026-10-08');
  });
});
