import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const vacioANulo = ({ value }: { value: unknown }) => {
  const texto = recortar({ value });
  return texto === '' ? null : texto;
};

export const ESTADOS_CIVILES_BAUTISMO = [
  'soltero',
  'matrimonio_catolico',
  'union_civil',
  'union_libre',
  'divorciado',
] as const;

export const CONDICIONES_BAUTISMO = [
  'padre_madre',
  'padrino_madrina',
  'formacion_catequetica',
] as const;

export const PROVINCIAS_COSTA_RICA = [
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón',
] as const;

const LETRAS_CON_ESPACIO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const LETRAS_SIN_ESPACIO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

@ValidatorConstraint({ name: 'adultoCatequesisBautismo', async: false })
class AdultoCatequesisBautismoConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (typeof value !== 'string' || !FECHA.test(value)) return false;
    const nacimiento = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (nacimiento > hoy) return false;
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad -= 1;
    }
    return edad >= 18;
  }

  defaultMessage(args: ValidationArguments): string {
    const nacimiento = new Date(`${String(args.value)}T00:00:00`);
    if (!Number.isNaN(nacimiento.getTime()) && nacimiento > new Date()) {
      return 'La fecha de nacimiento no puede ser futura.';
    }
    return 'Debe tener al menos 18 años para inscribirse.';
  }
}

export class CrearInscripcionCatequesisBautismoDto {
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(25, {
    message: 'El nombre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El nombre solo puede contener letras.',
  })
  nombre: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El primer apellido es obligatorio.' })
  @MaxLength(25, {
    message: 'El primer apellido no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El primer apellido solo puede contener letras.',
  })
  apellido1: string;

  @Transform(vacioANulo)
  @IsOptional()
  @IsString()
  @MaxLength(25, {
    message: 'El segundo apellido no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El segundo apellido solo puede contener letras.',
  })
  apellido2?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria.' })
  @Validate(AdultoCatequesisBautismoConstraint)
  fechaNacimiento: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria.' })
  @Matches(/^\d{9}$/, { message: 'La cédula debe tener 9 dígitos.' })
  cedula: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'El formato debe ser 8888-8888.',
  })
  telefono: string;

  @IsIn(ESTADOS_CIVILES_BAUTISMO, {
    message: 'Seleccione un estado civil válido.',
  })
  estadoCivil: (typeof ESTADOS_CIVILES_BAUTISMO)[number];

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'La parroquia de origen es obligatoria.' })
  @MaxLength(25, {
    message: 'La parroquia de origen no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'La parroquia de origen solo puede contener letras.',
  })
  parroquiaOrigen: string;

  @IsIn(PROVINCIAS_COSTA_RICA, {
    message: 'Seleccione una provincia de Costa Rica.',
  })
  provincia: (typeof PROVINCIAS_COSTA_RICA)[number];

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El cantón es obligatorio.' })
  @MaxLength(25, {
    message: 'El cantón no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El cantón solo puede contener letras.',
  })
  canton: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El distrito es obligatorio.' })
  @MaxLength(25, {
    message: 'El distrito no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El distrito solo puede contener letras.',
  })
  distrito: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El barrio es obligatorio.' })
  @MaxLength(25, {
    message: 'El barrio no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El barrio solo puede contener letras.',
  })
  barrio: string;

  @IsIn(CONDICIONES_BAUTISMO, {
    message: 'Seleccione la condición con la que se inscribe.',
  })
  condicion: (typeof CONDICIONES_BAUTISMO)[number];
}

export class ActualizarEstadoCatequesisBautismoDto {
  @IsIn(['Aprobada', 'Rechazada'], {
    message: 'El estado solo puede ser Aprobada o Rechazada.',
  })
  estado: 'Aprobada' | 'Rechazada';

  @Transform(vacioANulo)
  @ValidateIf(
    (dto: ActualizarEstadoCatequesisBautismoDto) => dto.estado === 'Rechazada',
  )
  @IsString()
  @IsNotEmpty({
    message: 'La observación es obligatoria al rechazar la solicitud.',
  })
  @MaxLength(500)
  observacionAdministrativa?: string | null;

  @ValidateIf(
    (dto: ActualizarEstadoCatequesisBautismoDto) => dto.estado === 'Aprobada',
  )
  @IsString()
  @IsNotEmpty({ message: 'Indique el inicio de las catequesis.' })
  @Matches(FECHA, { message: 'El inicio de las catequesis no es una fecha válida.' })
  fechaInicioCatequesis?: string;

  @ValidateIf(
    (dto: ActualizarEstadoCatequesisBautismoDto) => dto.estado === 'Aprobada',
  )
  @IsString()
  @IsNotEmpty({ message: 'Indique la finalización de las catequesis.' })
  @Matches(FECHA, {
    message: 'La finalización de las catequesis no es una fecha válida.',
  })
  fechaFinalizacionCatequesis?: string;

  @Transform(recortar)
  @ValidateIf(
    (dto: ActualizarEstadoCatequesisBautismoDto) => dto.estado === 'Aprobada',
  )
  @IsString()
  @IsNotEmpty({ message: 'Indique el responsable que certifica.' })
  @MaxLength(25, {
    message: 'El responsable no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El responsable solo puede contener letras.',
  })
  responsableCertifica?: string;
}
