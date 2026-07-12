import { Type } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ESTADOS_INSCRIPCION_VALIDOS,
  MENSAJE_ESTADO_INVALIDO,
  MENSAJE_NIVEL_INVALIDO,
} from '../../../Common/Utils/inscripcion-catequesis-validaciones';

export class DatosInscripcionDto {
  @IsString()
  @IsNotEmpty({ message: 'El centro de catequesis es obligatorio.' })
  centroCatequesis: string;

  @IsString()
  @IsNotEmpty({ message: 'El nivel a inscribirse es obligatorio.' })
  @IsIn(['Primero', 'Sétimo', 'primero', 'sétimo', 'setimo', 'septimo'], {
    message: MENSAJE_NIVEL_INVALIDO,
  })
  nivelAInscribirse: string;

  @IsString()
  @IsNotEmpty({ message: 'La fe de bautismo es obligatoria.' })
  feBautismoArchivo: string;
}

export class DatosCatequizandoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del catequizando es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos del catequizando son obligatorios.' })
  apellidos: string;

  @IsDateString({}, { message: 'La fecha de nacimiento es obligatoria.' })
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección exacta del catequizando es obligatoria.' })
  direccionExacta: string;
}

export class DatosBautismoDto {
  @IsString()
  @IsNotEmpty({ message: 'La parroquia de bautismo es obligatoria.' })
  parroquia: string;

  @IsOptional()
  @IsDateString()
  fecha?: string | null;

  @IsOptional()
  @IsString()
  tomo?: string | null;

  @IsOptional()
  @IsString()
  folio?: string | null;

  @IsOptional()
  @IsString()
  asiento?: string | null;
}

export class DatosAdecuacionDto {
  @IsBoolean({
    message: 'Debe indicar si requiere adecuación en el centro educativo.',
  })
  requiereAdecuacionCentroEducativo: boolean;

  @ValidateIf((dto: DatosAdecuacionDto) => dto.requiereAdecuacionCentroEducativo)
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
  @IsString()
  @IsNotEmpty({
    message:
      'La descripción de la enfermedad es obligatoria cuando es portador de enfermedad crónica.',
  })
  descripcionEnfermedad?: string | null;
}

export class DatosMadreDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la madre o encargada es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({
    message: 'Los apellidos de la madre o encargada son obligatorios.',
  })
  apellidos: string;

  @IsString()
  @IsNotEmpty({
    message: 'La dirección exacta de la madre o encargada es obligatoria.',
  })
  direccionExacta: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad de la madre o encargada es obligatoria.' })
  ciudad: string;

  @IsString()
  @IsNotEmpty({ message: 'La provincia de la madre o encargada es obligatoria.' })
  provincia: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono de la madre o encargada es obligatorio.' })
  telefono: string;
}

export class DatosPadreDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}

export class DatosPersonaInscribeDto {
  @IsString()
  @IsNotEmpty({
    message: 'El nombre de la persona que inscribe es obligatorio.',
  })
  nombre: string;

  @IsString()
  @IsNotEmpty({
    message: 'Los apellidos de la persona que inscribe son obligatorios.',
  })
  apellidos: string;

  @IsString()
  @IsNotEmpty({ message: 'El parentesco es obligatorio.' })
  parentesco: string;

  @IsOptional()
  @IsString()
  correo?: string;
}

export class DatosPagoDto {
  @IsString()
  @IsNotEmpty({ message: 'El método de pago es obligatorio.' })
  metodoPago: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de comprobante SINPE es obligatorio.' })
  numeroComprobanteSinpe: string;

  @IsString()
  @IsNotEmpty({ message: 'El comprobante de pago es obligatorio.' })
  comprobanteArchivo: string;

  @IsNumber({}, { message: 'El monto debe ser mayor que cero.' })
  @Min(1, { message: 'El monto debe ser mayor que cero.' })
  monto: number;
}

export class CrearInscripcionCatequesisDto {
  @ValidateNested()
  @Type(() => DatosInscripcionDto)
  datosInscripcion: DatosInscripcionDto;

  @ValidateNested()
  @Type(() => DatosCatequizandoDto)
  datosCatequizando: DatosCatequizandoDto;

  @ValidateNested()
  @Type(() => DatosBautismoDto)
  datosBautismo: DatosBautismoDto;

  @ValidateNested()
  @Type(() => DatosAdecuacionDto)
  datosAdecuacion: DatosAdecuacionDto;

  @ValidateNested()
  @Type(() => DatosCondicionSaludDto)
  datosCondicionSalud: DatosCondicionSaludDto;

  @ValidateNested()
  @Type(() => DatosMadreDto)
  datosMadre: DatosMadreDto;

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
  @IsString()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsIn([...ESTADOS_INSCRIPCION_VALIDOS], {
    message: MENSAJE_ESTADO_INVALIDO,
  })
  estado: string;

  @ValidateIf((dto: ActualizarEstadoInscripcionDto) =>
    dto.estado?.toLowerCase() === 'rechazada',
  )
  @IsString()
  @IsNotEmpty({
    message:
      'La observación administrativa es obligatoria cuando el estado es Rechazada.',
  })
  observacion?: string | null;
}
