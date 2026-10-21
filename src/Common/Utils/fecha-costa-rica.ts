// Fecha YYYY-MM-DD en hora de Costa Rica. toISOString() daría el día UTC, que cambia a las 6 p. m. en CR.
export function fechaCostaRica(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
}
