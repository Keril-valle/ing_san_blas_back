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
  @MaxLength(300, {
    message: 'La descripción no puede superar 300 caracteres.',
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
  @MaxLength(8, { message: 'El icono de la tarjeta no puede superar 8 caracteres.' })
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
  @MaxLength(280, {
    message: 'El texto de la tarjeta no puede superar 280 caracteres.',
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
  @MaxLength(400, {
    message: 'La descripción no puede superar 400 caracteres.',
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

export class UpdateHistoriaDto {
  @Transform(transformarTexto)
  @IsString({ message: 'La etiqueta debe ser texto.' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria.' })
  @MaxLength(40, { message: 'La etiqueta no puede superar 40 caracteres.' })
  eyebrow: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El subtítulo debe ser texto.' })
  @IsNotEmpty({ message: 'El subtítulo es obligatorio.' })
  @MaxLength(160, { message: 'El subtítulo no puede superar 160 caracteres.' })
  subtitle: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El párrafo de orígenes debe ser texto.' })
  @IsNotEmpty({ message: 'El párrafo de orígenes es obligatorio.' })
  @MaxLength(800, {
    message: 'El párrafo de orígenes no puede superar 800 caracteres.',
  })
  origenes: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El párrafo de restauraciones debe ser texto.' })
  @IsNotEmpty({ message: 'El párrafo de restauraciones es obligatorio.' })
  @MaxLength(800, {
    message: 'El párrafo de restauraciones no puede superar 800 caracteres.',
  })
  restauraciones: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La cita espiritual debe ser texto.' })
  @IsNotEmpty({ message: 'La cita espiritual es obligatoria.' })
  @MaxLength(300, { message: 'La cita no puede superar 300 caracteres.' })
  cita: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El párrafo de la fachada debe ser texto.' })
  @IsNotEmpty({ message: 'El párrafo de la fachada es obligatorio.' })
  @MaxLength(800, {
    message: 'El párrafo de la fachada no puede superar 800 caracteres.',
  })
  fachada: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El párrafo de invitación debe ser texto.' })
  @IsNotEmpty({ message: 'El párrafo de invitación es obligatorio.' })
  @MaxLength(800, {
    message: 'El párrafo de invitación no puede superar 800 caracteres.',
  })
  invitacion: string;

  @Transform(aYoutubeEmbed)
  @IsString({ message: 'El enlace del video debe ser texto.' })
  @IsNotEmpty({ message: 'El enlace del video es obligatorio.' })
  @MaxLength(200, {
    message: 'El enlace del video no puede superar 200 caracteres.',
  })
  @Matches(/^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+(?:\?.*)?$/, {
    message: 'El video debe usar el formato https://www.youtube.com/embed/...',
  })
  videoUrl: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen del encabezado no es válida.' },
  )
  headerImageUrl?: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen de la cita no es válida.' },
  )
  quoteImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  eliminarHeaderImagen?: boolean;

  @IsOptional()
  @IsBoolean()
  eliminarQuoteImagen?: boolean;
}

export class UpdateContactoDto {
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
  @MaxLength(220, {
    message: 'La introducción no puede superar 220 caracteres.',
  })
  intro: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El teléfono debe ser texto.' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @MaxLength(40, { message: 'El teléfono no puede superar 40 caracteres.' })
  @Matches(/^[\d+\s()-]{7,40}$/, {
    message: 'El teléfono no tiene un formato válido.',
  })
  telefono: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El correo debe ser texto.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido.' })
  @MaxLength(80, { message: 'El correo no puede superar 80 caracteres.' })
  correo: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La ubicación debe ser texto.' })
  @IsNotEmpty({ message: 'La ubicación es obligatoria.' })
  @MaxLength(120, { message: 'La ubicación no puede superar 120 caracteres.' })
  ubicacion: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Los horarios de atención son obligatorios.' })
  @ArrayMinSize(1, { message: 'Incluya al menos un horario de atención.' })
  @IsString({ each: true, message: 'Cada horario debe ser texto.' })
  @MaxLength(200, {
    each: true,
    message: 'Cada horario no puede superar 200 caracteres.',
  })
  horariosAtencion: string[];

  @Transform(transformarTexto)
  @IsString({ message: 'La URL del mapa debe ser texto.' })
  @IsNotEmpty({ message: 'La URL del mapa es obligatoria.' })
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL del mapa no es válida.' },
  )
  mapaUrl: string;
}

// fila día → horas del volante (ej. Domingo :: 07:00 AM, 08:00 AM)
export class HorarioFilaDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El día debe ser texto.' })
  @IsNotEmpty({ message: 'El día es obligatorio.' })
  @MaxLength(80, {
    message: 'El día no puede superar 80 caracteres.',
  })
  dia: string;

  @Transform(recortarLineas)
  @IsArray({ message: 'Las horas son obligatorias.' })
  @ArrayMinSize(1, { message: 'Cada fila debe incluir al menos una hora.' })
  @ArrayMaxSize(10, { message: 'Cada fila puede incluir máximo 10 horas.' })
  @IsString({ each: true, message: 'Cada hora debe ser texto.' })
  @MaxLength(120, {
    each: true,
    message: 'Cada hora no puede superar 120 caracteres.',
  })
  horas: string[];
}

// bloque del volante (ej. Entre semana, Misa dominical) con sus filas
export class HorarioBloqueDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título del bloque debe ser texto.' })
  @IsNotEmpty({ message: 'El título del bloque es obligatorio.' })
  @MaxLength(80, {
    message: 'El título del bloque no puede superar 80 caracteres.',
  })
  titulo: string;

  @IsArray({ message: 'Las filas del bloque son obligatorias.' })
  @ArrayMinSize(1, { message: 'Cada bloque debe incluir al menos una fila.' })
  @ArrayMaxSize(10, { message: 'Cada bloque puede incluir máximo 10 filas.' })
  @ValidateNested({ each: true })
  @Type(() => HorarioFilaDto)
  filas: HorarioFilaDto[];
}

export class UpdateHorariosDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(80, { message: 'El título no puede superar 80 caracteres.' })
  title: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El subtítulo debe ser texto.' })
  @IsNotEmpty({ message: 'El subtítulo es obligatorio.' })
  @MaxLength(80, { message: 'El subtítulo no puede superar 80 caracteres.' })
  subtitle: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El título destacado debe ser texto.' })
  @IsNotEmpty({ message: 'El título destacado es obligatorio.' })
  @MaxLength(80, {
    message: 'El título destacado no puede superar 80 caracteres.',
  })
  titleHighlight: string;

  @Transform(transformarTexto)
  @IsString({ message: 'La introducción debe ser texto.' })
  @IsNotEmpty({ message: 'La introducción es obligatoria.' })
  @MaxLength(220, {
    message: 'La introducción no puede superar 220 caracteres.',
  })
  intro: string;

  @IsArray({ message: 'Los bloques de horarios son obligatorios.' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un bloque de horarios.' })
  @ArrayMaxSize(4, { message: 'Puede incluir máximo 4 bloques de horarios.' })
  @ValidateNested({ each: true })
  @Type(() => HorarioBloqueDto)
  bloques: HorarioBloqueDto[];

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
