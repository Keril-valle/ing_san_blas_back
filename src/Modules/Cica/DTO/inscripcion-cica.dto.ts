import { Transform } from 'class-transformer';
import { IdentificacionCatequesisDto } from '../../../Common/DTO/identificacion-catequesis.dto';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
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

export const ESTADOS_CIVILES_CICA = [
  'soltero',
  'matrimonio_civil',
  'matrimonio_catolico',
  'union_libre',
  'union_civil',
  'divorciado',
] as const;

export const PROVINCIAS_COSTA_RICA_CICA = [
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón',
] as const;

export const ESTADOS_CON_PAREJA_CICA = [
  'matrimonio_civil',
  'matrimonio_catolico',
  'union_libre',
  'union_civil',
] as const;

export const requiereConyugeCica = (
  estadoCivil?: (typeof ESTADOS_CIVILES_CICA)[number],
): boolean =>
  Boolean(
    estadoCivil &&
      ESTADOS_CON_PAREJA_CICA.includes(
        estadoCivil as (typeof ESTADOS_CON_PAREJA_CICA)[number],
      ),
  );

const LETRAS_CON_ESPACIO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const LETRAS_SIN_ESPACIO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;
const CORREO_CICA = /^[\p{L}0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u;

@ValidatorConstraint({ name: 'adultoCica', async: false })
class AdultoCicaConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
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
    return 'Debe tener al menos 18 años para inscribirse en CICA.';
  }
}

export class CrearInscripcionCicaDto extends IdentificacionCatequesisDto {
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
  @Validate(AdultoCicaConstraint)
  fechaNacimiento: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'La nacionalidad es obligatoria.' })
  @MaxLength(25, {
    message: 'La nacionalidad no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'La nacionalidad solo puede contener letras.',
  })
  nacionalidad: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'El formato debe ser 8888-8888.',
  })
  telefono: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @Matches(CORREO_CICA, {
    message: 'Ingrese un correo válido. Ej: nombre@dominio.com',
  })
  @MaxLength(120)
  correo: string;

  @IsIn(ESTADOS_CIVILES_CICA, {
    message: 'Seleccione un estado civil válido.',
  })
  estadoCivil: (typeof ESTADOS_CIVILES_CICA)[number];

  @Transform(vacioANulo)
  @ValidateIf((dto: CrearInscripcionCicaDto) =>
    requiereConyugeCica(dto.estadoCivil),
  )
  @IsString()
  @IsNotEmpty({
    message: 'El nombre del cónyuge o compañero(a) es obligatorio.',
  })
  @MinLength(3, {
    message:
      'El nombre del cónyuge o compañero(a) debe tener al menos 3 caracteres.',
  })
  @MaxLength(25, {
    message:
      'El nombre del cónyuge o compañero(a) no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El nombre del cónyuge o compañero(a) solo puede contener letras.',
  })
  conyugeNombre?: string | null;

  @Transform(vacioANulo)
  @ValidateIf((dto: CrearInscripcionCicaDto) =>
    requiereConyugeCica(dto.estadoCivil),
  )
  @IsString()
  @IsNotEmpty({
    message: 'El primer apellido del cónyuge o compañero(a) es obligatorio.',
  })
  @MaxLength(25, {
    message:
      'El primer apellido del cónyuge o compañero(a) no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message:
      'El primer apellido del cónyuge o compañero(a) solo puede contener letras.',
  })
  conyugeApellido1?: string | null;

  @Transform(vacioANulo)
  @IsOptional()
  @IsString()
  @MaxLength(25, {
    message:
      'El segundo apellido del cónyuge o compañero(a) no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message:
      'El segundo apellido del cónyuge o compañero(a) solo puede contener letras.',
  })
  conyugeApellido2?: string | null;

  @IsBoolean()
  necesitaBautizo: boolean;

  @IsBoolean()
  necesitaPrimeraComunion: boolean;

  @IsBoolean()
  necesitaConfirmacion: boolean;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del padre es obligatorio.' })
  @MaxLength(25, {
    message: 'El nombre del padre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El nombre del padre solo puede contener letras.',
  })
  padreNombre: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El primer apellido del padre es obligatorio.' })
  @MaxLength(25, {
    message: 'El primer apellido del padre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El primer apellido del padre solo puede contener letras.',
  })
  padreApellido1: string;

  @Transform(vacioANulo)
  @IsOptional()
  @IsString()
  @MaxLength(25, {
    message: 'El segundo apellido del padre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El segundo apellido del padre solo puede contener letras.',
  })
  padreApellido2?: string | null;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la madre es obligatorio.' })
  @MaxLength(25, {
    message: 'El nombre de la madre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El nombre de la madre solo puede contener letras.',
  })
  madreNombre: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El primer apellido de la madre es obligatorio.' })
  @MaxLength(25, {
    message: 'El primer apellido de la madre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El primer apellido de la madre solo puede contener letras.',
  })
  madreApellido1: string;

  @Transform(vacioANulo)
  @IsOptional()
  @IsString()
  @MaxLength(25, {
    message: 'El segundo apellido de la madre no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_SIN_ESPACIO, {
    message: 'El segundo apellido de la madre solo puede contener letras.',
  })
  madreApellido2?: string | null;

  @IsIn(PROVINCIAS_COSTA_RICA_CICA, {
    message: 'Seleccione una provincia de Costa Rica.',
  })
  provincia: (typeof PROVINCIAS_COSTA_RICA_CICA)[number];

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El cantón es obligatorio.' })
  @MaxLength(50, {
    message: 'El cantón no puede superar los 50 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El cantón solo puede contener letras.',
  })
  canton: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El distrito es obligatorio.' })
  @MaxLength(50, {
    message: 'El distrito no puede superar los 50 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El distrito solo puede contener letras.',
  })
  distrito: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'La dirección del hogar es obligatoria.' })
  @MinLength(10, {
    message: 'La dirección debe tener al menos 10 caracteres.',
  })
  @MaxLength(100, {
    message: 'La dirección no puede superar los 100 caracteres.',
  })
  direccionHogar: string;

  @IsBoolean()
  esCatolico: boolean;

  @Transform(vacioANulo)
  @ValidateIf((dto: CrearInscripcionCicaDto) => dto.esCatolico === false)
  @IsString()
  @IsNotEmpty({
    message: 'Indique el nombre de la otra iglesia. Debe tener al menos 2 caracteres.',
  })
  @MinLength(2, {
    message: 'Indique el nombre de la otra iglesia. Debe tener al menos 2 caracteres.',
  })
  @MaxLength(25, {
    message: 'El nombre de la otra iglesia no puede superar los 25 caracteres.',
  })
  @Matches(LETRAS_CON_ESPACIO, {
    message: 'El nombre de la otra iglesia solo puede contener letras.',
  })
  otraIglesia?: string | null;

  @Transform(vacioANulo)
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'La observación no puede superar los 200 caracteres.',
  })
  observacion?: string | null;
}

export class ActualizarEstadoCicaDto {
  @IsIn(['Aprobada', 'Rechazada'], {
    message: 'El estado solo puede ser Aprobada o Rechazada.',
  })
  estado: 'Aprobada' | 'Rechazada';

  @Transform(vacioANulo)
  @ValidateIf((dto: ActualizarEstadoCicaDto) => dto.estado === 'Rechazada')
  @IsString()
  @IsNotEmpty({
    message: 'La observación es obligatoria al rechazar la solicitud.',
  })
  @MaxLength(500)
  observacionAdministrativa?: string | null;
}
