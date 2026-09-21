/**
 * Reglas alineadas con el editor del landing
 * (landingSectionConfig.ts y landingValidation.ts del frontend).
 * Cualquier cambio de obligatoriedad, formato o longitud debe aplicarse en ambos lados.
 */
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

function aYoutubeEmbed({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }

  const valor = value.trim();
  const embed = valor.match(
    /^https:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]+)/i,
  );
  if (embed) {
    return `https://www.youtube.com/embed/${embed[1]}`;
  }

  const watch = valor.match(/[?&]v=([A-Za-z0-9_-]+)/);
  if (watch) {
    return `https://www.youtube.com/embed/${watch[1]}`;
  }

  const corto = valor.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]+)/i);
  if (corto) {
    return `https://www.youtube.com/embed/${corto[1]}`;
  }

  return valor;
}

function recortarLineas({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => typeof item === 'string' && item.length > 0);
}

export class UpdateHeroDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El encabezado debe ser texto.' })
  @IsNotEmpty({ message: 'El encabezado es obligatorio.' })
  @MaxLength(40, { message: 'El encabezado no puede superar 40 caracteres.' })
  subtitle: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título destacado debe ser texto.' })
  @IsNotEmpty({ message: 'El título destacado es obligatorio.' })
  @MaxLength(80, {
    message: 'El título destacado no puede superar 80 caracteres.',
  })
  titleHighlight: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La descripción debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MaxLength(200, {
    message: 'La descripción no puede superar 200 caracteres.',
  })
  description: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen no es válida.' },
  )
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  eliminarImagen?: boolean;
}

export class SobreNosotrosCardDto {
  @IsOptional()
  @Transform(transformarTexto)
  @IsString()
  @MaxLength(8, {
    message: 'El icono de la tarjeta no puede superar 8 caracteres.',
  })
  icono?: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título de la tarjeta debe ser texto.' })
  @IsNotEmpty({ message: 'El título de la tarjeta es obligatorio.' })
  @MaxLength(80, {
    message: 'El título de la tarjeta no puede superar 80 caracteres.',
  })
  titulo: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El texto de la tarjeta debe ser texto.' })
  @IsNotEmpty({ message: 'El texto de la tarjeta es obligatorio.' })
  @MaxLength(220, {
    message: 'El texto de la tarjeta no puede superar 220 caracteres.',
  })
  texto: string;
}

export class UpdateSobreNosotrosDto {
  @Transform(transformarTexto)
  @IsString({ message: 'La etiqueta debe ser texto.' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria.' })
  @MaxLength(40, { message: 'La etiqueta no puede superar 40 caracteres.' })
  eyebrow: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(160, { message: 'El título no puede superar 160 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La descripción debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MaxLength(300, {
    message: 'La descripción no puede superar 300 caracteres.',
  })
  lead: string;

  @IsArray({ message: 'Las tarjetas son obligatorias.' })
  @ArrayMinSize(4, { message: 'Debe incluir 4 tarjetas.' })
  @ArrayMaxSize(4, { message: 'Debe incluir 4 tarjetas.' })
  @ValidateNested({ each: true })
  @Type(() => SobreNosotrosCardDto)
  cards: SobreNosotrosCardDto[];

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen no es válida.' },
  )
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  eliminarImagen?: boolean;
}

export { UpdateHistoriaDto } from './update-historia.dto';

export { UpdateContactoDto } from './update-contacto.dto';

export {
  HorarioFilaDto,
  HorarioBloqueDto,
  UpdateHorariosDto,
} from './update-horarios.dto';

export class UpdateBautizosDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La introducción debe ser texto.' })
  @IsNotEmpty({ message: 'La introducción es obligatoria.' })
  @MaxLength(260, {
    message: 'La introducción no puede superar 260 caracteres.',
  })
  intro: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Los requisitos son obligatorios.' })
  @ArrayMinSize(1, { message: 'Incluya al menos un requisito.' })
  @IsString({ each: true, message: 'Cada requisito debe ser texto.' })
  @MaxLength(200, {
    each: true,
    message: 'Cada requisito no puede superar 200 caracteres.',
  })
  requisitos: string[];

  @Transform(transformarTexto)
  @IsString({ message: 'El texto de charlas debe ser texto.' })
  @IsNotEmpty({ message: 'Las charlas prebautismales son obligatorias.' })
  @MaxLength(300, {
    message: 'Las charlas prebautismales no pueden superar 300 caracteres.',
  })
  charlas: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El texto de solicitud debe ser texto.' })
  @IsNotEmpty({ message: 'El texto de solicitud es obligatorio.' })
  @MaxLength(300, {
    message: 'El texto de solicitud no puede superar 300 caracteres.',
  })
  solicitud: string;
}

// detalle opcional que se muestra en el modal del carrusel de servicios
export class ServicioDetalleDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El subtítulo del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'El subtítulo del servicio es obligatorio.' })
  @MaxLength(120, {
    message: 'El subtítulo del servicio no puede superar 120 caracteres.',
  })
  subtitle: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La descripción ampliada debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción ampliada es obligatoria.' })
  @MaxLength(300, {
    message: 'La descripción ampliada no puede superar 300 caracteres.',
  })
  description: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El horario del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'El horario del servicio es obligatorio.' })
  @MaxLength(300, {
    message: 'El horario del servicio no puede superar 300 caracteres.',
  })
  schedule: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Los requisitos del servicio son obligatorios.' })
  @ArrayMinSize(1, { message: 'Incluya al menos un requisito del servicio.' })
  @IsString({ each: true, message: 'Cada requisito debe ser texto.' })
  @MaxLength(200, {
    each: true,
    message: 'Cada requisito no puede superar 200 caracteres.',
  })
  requirements: string[];

  @Transform(transformarTexto)
  @IsString({ message: 'El contacto del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'El contacto del servicio es obligatorio.' })
  @MaxLength(200, {
    message: 'El contacto del servicio no puede superar 200 caracteres.',
  })
  contact: string;
}

export class ServicioItemDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'El título del servicio es obligatorio.' })
  @MaxLength(80, {
    message: 'El título del servicio no puede superar 80 caracteres.',
  })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La descripción del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción del servicio es obligatoria.' })
  @MaxLength(300, {
    message: 'La descripción del servicio no puede superar 300 caracteres.',
  })
  description: string;

  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen del servicio no es válida.' },
  )
  imageUrl?: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La categoría del servicio debe ser texto.' })
  @IsNotEmpty({ message: 'La categoría del servicio es obligatoria.' })
  @MaxLength(60, {
    message: 'La categoría del servicio no puede superar 60 caracteres.',
  })
  category: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El texto del botón debe ser texto.' })
  @IsNotEmpty({ message: 'El texto del botón es obligatorio.' })
  @MaxLength(40, {
    message: 'El texto del botón no puede superar 40 caracteres.',
  })
  buttonLabel: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsString({ message: 'El enlace del servicio debe ser texto.' })
  @MaxLength(200, {
    message: 'El enlace del servicio no puede superar 200 caracteres.',
  })
  linkTo?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServicioDetalleDto)
  modalDetails?: ServicioDetalleDto;
}

export class UpdateServiciosDto {
  @Transform(transformarTexto)
  @IsString({ message: 'La etiqueta debe ser texto.' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria.' })
  @MaxLength(40, { message: 'La etiqueta no puede superar 40 caracteres.' })
  eyebrow: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La introducción debe ser texto.' })
  @IsNotEmpty({ message: 'La introducción es obligatoria.' })
  @MaxLength(260, {
    message: 'La introducción no puede superar 260 caracteres.',
  })
  intro: string;

  @IsArray({ message: 'Los servicios son obligatorios.' })
  @ArrayMinSize(1, { message: 'Incluya al menos un servicio.' })
  @ArrayMaxSize(12, { message: 'Puede incluir máximo 12 servicios.' })
  @ValidateNested({ each: true })
  @Type(() => ServicioItemDto)
  items: ServicioItemDto[];
}

export { UpdateDonacionesDto } from './update-donaciones.dto';
