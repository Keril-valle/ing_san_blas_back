/**
 * Mensajes que nunca deben llegar a la pantalla del usuario: son errores de
 * JavaScript, de TypeORM o de validación interna. Si alguno aparece en una
 * respuesta, el filtro global lo sustituye por el texto genérico del estado
 * HTTP correspondiente.
 *
 * Se comparte entre el filtro global y rethrowComoBadRequest para que ambos
 * usen exactamente el mismo criterio.
 */
const PATRON_TECNICO =
  /(query failed|syntax error|typeorm|exception|stack|sql|postgres|econn|at \w+\(|cannot read propert|is not a function|non-nullable|must be an object or an array|undefined is not)/i;

// Errores de sintaxis que devuelve Express al no poder leer el JSON del body.
const PATRON_JSON =
  /^(unexpected token|unexpected end of json|expected property name|invalid json|json parse error|.* is not valid json)/i;

export const esMensajeTecnico = (mensaje: string): boolean =>
  PATRON_TECNICO.test(mensaje) || PATRON_JSON.test(mensaje.trim());
