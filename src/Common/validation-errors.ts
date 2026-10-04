import { ValidationError } from 'class-validator';

// Mensajes por defecto de class-validator llegan en inglés. Aquí se traducen
// los que efectivamente aparecen en este proyecto para que el panel y los
// formularios públicos muestren todo en español.
const TRADUCCIONES: [RegExp, string][] = [
  [
    /^(\S+) must be longer than or equal to (\d+) characters?$/,
    '$1 debe tener al menos $2 caracteres',
  ],
  [
    /^(\S+) must be shorter than or equal to (\d+) characters?$/,
    '$1 debe tener como máximo $2 caracteres',
  ],
  [/^(\S+) must not be less than (\d+)$/, '$1 debe ser mayor o igual a $2'],
  [/^(\S+) must not be greater than (\d+)$/, '$1 debe ser menor o igual a $2'],
  [/^(\S+) should not be empty$/, '$1 no puede estar vacío'],
  [/^(\S+) must be a string$/, '$1 debe ser un texto'],
  [/^(\S+) must be an email$/, '$1 debe ser un correo válido'],
  [/^(\S+) must be a number$/, '$1 debe ser un número'],
  [/^(\S+) must be an integer$/, '$1 debe ser un número entero'],
  [/^(\S+) must be a boolean$/, '$1 debe ser verdadero o falso'],
  [
    /^(\S+) must be one of the following values: (.+)$/,
    '$1 debe ser uno de los siguientes valores: $2',
  ],
  [/^(\S+) must match .* pattern$/, '$1 no tiene un formato válido'],
  [/^(\S+) must be a ISO8601 date string$/, '$1 debe ser una fecha válida'],
  [/^(\S+) must be an array$/, '$1 debe ser una lista'],
  [/^(\S+) must be an object$/, '$1 debe ser un objeto'],
  [/^(\S+) must be null$/, '$1 debe quedar vacío'],
  [/^(\S+) must not be null$/, '$1 no puede ser nulo'],
];

export function traducirMensajeValidacion(mensaje: string): string {
  for (const [patron, plantilla] of TRADUCCIONES) {
    const coincidencia = mensaje.match(patron);
    if (!coincidencia) continue;

    let traduccion = plantilla;
    for (const [indice, valor] of coincidencia.slice(1).entries()) {
      // función en vez de texto para no expandir "$" que traiga el valor
      traduccion = traduccion.replace(`$${indice + 1}`, () => valor ?? '');
    }
    return traduccion;
  }
  return mensaje;
}

export function mapValidationErrors(errors: ValidationError[]): {
  mensaje: string;
  errores: Record<string, string[]>;
} {
  const errores: Record<string, string[]> = {};

  const collect = (list: ValidationError[], parent = '') => {
    for (const error of list) {
      const property = parent ? `${parent}.${error.property}` : error.property;

      if (error.constraints) {
        const nuevos = Object.values(error.constraints).map((mensaje) =>
          mensaje.includes('should not exist')
            ? `El campo ${error.property} no está permitido.`
            : traducirMensajeValidacion(mensaje),
        );
        // un DTO puede repetir el mismo texto en varios validadores del
        // mismo campo; el formulario lo mostraría esa misma vez repetida
        errores[property] = [
          ...new Set([...(errores[property] ?? []), ...nuevos]),
        ];
      }

      if (error.children?.length) {
        collect(error.children, property);
      }
    }
  };

  collect(errors);

  return {
    mensaje:
      Object.values(errores).flat()[0] ??
      'Los datos enviados no son válidos. Revise e intente de nuevo.',
    errores,
  };
}
