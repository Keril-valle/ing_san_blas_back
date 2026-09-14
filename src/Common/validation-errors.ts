import { ValidationError } from 'class-validator';

export function mapValidationErrors(errors: ValidationError[]): {
  mensaje: string;
  errores: Record<string, string[]>;
} {
  const errores: Record<string, string[]> = {};

  const collect = (list: ValidationError[], parent = '') => {
    for (const error of list) {
      const property = parent ? `${parent}.${error.property}` : error.property;

      if (error.constraints) {
        errores[property] = Object.values(error.constraints).map((mensaje) =>
          mensaje.includes('should not exist')
            ? `El campo ${error.property} no está permitido.`
            : mensaje,
        );
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
