import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

function aYoutubeEmbed({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  const watchMatch =
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]+)(?:&.*)?$/.exec(
      trimmed,
    );
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)(?:\?.*)?$/.exec(
    trimmed,
  );
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return trimmed;
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
  @Transform(transformarTexto)
  @IsUrl(
    { require_protocol: true },
    { message: 'La URL de la imagen del encabezado no es válida.' },
  )
  headerImageUrl?: string;

  @IsOptional()
  @Transform(transformarTexto)
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
