import { DatosCedula } from '../Interfaces/datosCedula';

async function getNombreCedula(cedula: string): Promise<DatosCedula | null> {
  try {
    const resp = await fetch(`https://apis.gometa.org/cedulas/${cedula}`);
    if (!resp.ok) return null;
    const data = await resp.json();

    if (data && data.nombre) {
      const parts = data.nombre.trim().split(' ');

      if (parts.length >= 2) {
        const firstName = parts[0];
        const middleName = parts.length >= 3 ? parts[1] : '';
        const surnames = parts.slice(parts.length >= 3 ? 2 : 1).join(' ');

        return {
          nombre: `${firstName} ${middleName}`.trim(),
          apellido1: surnames.split(' ')[0] ?? '',
          apellido2: surnames.split(' ').slice(1).join(' ') ?? '',
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default getNombreCedula;
