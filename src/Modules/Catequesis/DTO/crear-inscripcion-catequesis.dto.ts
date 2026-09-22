import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ESTADOS_INSCRIPCION_VALIDOS,
  MENSAJE_ESTADO_INVALIDO,
  MENSAJE_NIVEL_INVALIDO,
} from '../../../Common/Utils/inscripcion-catequesis-validaciones';

// quita espacios de los extremos antes de validar (así "   " cuenta como vacío y falla el IsNotEmpty)
const recortarTexto = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class DatosInscripcionDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El centro de catequesis es obligatorio.' })
  centroCatequesis: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El nivel a inscribirse es obligatorio.' })
  @IsIn(['Primero', 'Sétimo', 'primero', 'sétimo', 'setimo', 'septimo'], {
    message: MENSAJE_NIVEL_INVALIDO,
  })
  nivelAInscribirse: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'La fe de bautismo es obligatoria.' })
  feBautismoArchivo: string;
}

export class DatosCatequizandoDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del catequizando es obligatorio.' })
  nombre: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El primer apellido del catequizando es obligatorio.',
  })
  primerApellido: string;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  segundoApellido?: string | null;

  @Transform(recortarTexto)
  @IsDateString({}, { message: 'La fecha de nacimiento es obligatoria.' })
  fechaNacimiento: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'La dirección exacta del catequizando es obligatoria.',
  })
  direccionExacta: string;
}

export class DatosAdecuacionDto {
  @IsBoolean({
    message: 'Debe indicar si requiere adecuación en el centro educativo.',
  })
  requiereAdecuacionCentroEducativo: boolean;

  @ValidateIf(
    (dto: DatosAdecuacionDto) => dto.requiereAdecuacionCentroEducativo,
  )
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message:
      'La descripción de adecuación es obligatoria cuando requiere adecuación en el centro educativo.',
  })
  descripcionAdecuacion?: string | null;
}

export class DatosCondicionSaludDto {
  @IsBoolean({
    message:
      'Debe indicar si el catequizando es portador de enfermedad crónica.',
  })
  portadorEnfermedadCronica: boolean;

  @ValidateIf((dto: DatosCondicionSaludDto) => dto.portadorEnfermedadCronica)
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message:
      'La descripción de la enfermedad es obligatoria cuando es portador de enfermedad crónica.',
  })
  descripcionEnfermedad?: string | null;
}

export class DatosMadreDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la madre o encargada es obligatorio.' })
  nombre: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El primer apellido de la madre o encargada es obligatorio.',
  })
  primerApellido: string;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  segundoApellido?: string | null;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'La dirección exacta de la madre o encargada es obligatoria.',
  })
  direccionExacta: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'La ciudad de la madre o encargada es obligatoria.' })
  ciudad: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'La provincia de la madre o encargada es obligatoria.',
  })
  provincia: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El teléfono de la madre o encargada es obligatorio.',
  })
  telefono: string;
}

export class DatosPadreDto {
  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  nombre?: string;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  primerApellido?: string;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  segundoApellido?: string | null;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  telefono?: string;
}

export class DatosPersonaInscribeDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El nombre de la persona que inscribe es obligatorio.',
  })
  nombre: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El primer apellido de la persona que inscribe es obligatorio.',
  })
  primerApellido: string;

  @IsOptional()
  @Transform(recortarTexto)
  @IsString()
  segundoApellido?: string | null;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El parentesco es obligatorio.' })
  parentesco: string;

  @IsOptional()
  @Transform(recortarTexto)
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsEmail(
    {},
    {
      message: 'El correo de la persona que inscribe no es válido.',
    },
  )
  correo?: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message: 'El teléfono de la persona que inscribe es obligatorio.',
  })
  @Matches(/^\d{8}$/, {
    message: 'El teléfono de la persona que inscribe debe tener 8 dígitos.',
  })
  telefono: string;
}

export class DatosPagoDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El método de pago es obligatorio.' })
  metodoPago: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El número de comprobante SINPE es obligatorio.' })
  numeroComprobanteSinpe: string;

  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El comprobante de pago es obligatorio.' })
  comprobanteArchivo: string;
}

export class CrearInscripcionCatequesisDto {
  @ValidateNested()
  @Type(() => DatosInscripcionDto)
  datosInscripcion: DatosInscripcionDto;

  @ValidateNested()
  @Type(() => DatosCatequizandoDto)
  datosCatequizando: DatosCatequizandoDto;

  @ValidateNested()
  @Type(() => DatosAdecuacionDto)
  datosAdecuacion: DatosAdecuacionDto;

  @ValidateNested()
  @Type(() => DatosCondicionSaludDto)
  datosCondicionSalud: DatosCondicionSaludDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatosMadreDto)
  datosMadre?: DatosMadreDto;

  @ValidateNested()
  @Type(() => DatosPersonaInscribeDto)
  datosPersonaInscribe: DatosPersonaInscribeDto;

  @ValidateNested()
  @Type(() => DatosPagoDto)
  datosPago: DatosPagoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatosPadreDto)
  @Allow()
  datosPadre?: DatosPadreDto;
}

export class ActualizarEstadoInscripcionDto {
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsIn([...ESTADOS_INSCRIPCION_VALIDOS], {
    message: MENSAJE_ESTADO_INVALIDO,
  })
  estado: string;

  @ValidateIf(
    (dto: ActualizarEstadoInscripcionDto) =>
      dto.estado?.toLowerCase() === 'rechazada',
  )
  @Transform(recortarTexto)
  @IsString()
  @IsNotEmpty({
    message:
      'La observación administrativa es obligatoria cuando el estado es Rechazada.',
  })
  observacion?: string | null;
}
