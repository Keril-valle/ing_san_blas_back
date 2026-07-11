import { DatosCedula } from "../Interfaces/datosCedula";


async function getNombreCedula(cedula: string): Promise<DatosCedula | null> {
    try {
        const resp = await fetch(`https://apis.gometa.org/cedulas/${cedula}`);
        if (!resp.ok) return null;
        const data = await resp.json();

        if (data && data.nombre) {
            const [apellido1, apellido2, ...resto] = data.nombre.trim().split(' ');
            return {
                apellido1,
                apellido2,
                nombre: resto.join(' '),
            };
        }

        return null;
    } catch (e) {
        return null;
    }
}

export default getNombreCedula;