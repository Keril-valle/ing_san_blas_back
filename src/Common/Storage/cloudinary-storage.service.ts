import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Agent } from 'node:https';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const agenteCloudinary = new Agent({ rejectUnauthorized: false });

export const LIMITE_ARCHIVO_BYTES = 5 * 1024 * 1024;

export const EXTENSIONES_IMAGEN = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

export const EXTENSIONES_IMAGEN_SIN_GIF = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const EXTENSIONES_IMAGEN_O_PDF = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export interface SubirArchivoOpciones {
  /** Carpeta de Cloudinary, p. ej. `eventos` o `landing/hero/imagen`. */
  carpeta: string;
  extensionesPermitidas: ReadonlySet<string>;
  mensajeFormatoInvalido: string;
  mensajeErrorSubida: string;
  /** Por defecto se deriva de la extensión del archivo. */
  mimeType?: string;
  recurso?: 'image' | 'raw';
  formato?: string;
}

/**
 * Único punto de configuración y subida a Cloudinary de todo el backend.
 * Centraliza la validación del archivo, la generación del `public_id` y el
 * manejo de errores que antes estaba repetido en cada módulo.
 */
@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private configurado = false;

  constructor(private readonly configService: ConfigService) {}

  async subirArchivo(
    file: Express.Multer.File | undefined,
    opciones: SubirArchivoOpciones,
  ): Promise<string> {
    this.configurar();

    const buffer = this.validar(file, opciones);
    const extension = this.resolveExtension(file!.originalname);
    const mimeType = opciones.mimeType ?? `image/${extension.slice(1)}`;
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    try {
      const uploadResult = await cloudinary.uploader.upload(dataUrl, {
        public_id: `${opciones.carpeta}/${randomBytes(12).toString('hex')}`,
        resource_type: opciones.recurso ?? 'image',
        ...(opciones.formato ? { format: opciones.formato } : {}),
        agent: agenteCloudinary,
      });

      return uploadResult.secure_url ?? uploadResult.url;
    } catch (error) {
      this.logger.error(
        `Error subiendo archivo (${opciones.carpeta}) a Cloudinary: ${this.detalleError(error)}`,
      );
      throw new BadRequestException({ mensaje: opciones.mensajeErrorSubida });
    }
  }

  private configurar(): void {
    if (this.configurado) return;
    cloudinary.config({
      cloud_name:
        this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'rbrda5nv',
      api_key:
        this.configService.get<string>('CLOUDINARY_API_KEY') ||
        '915513564946372',
      api_secret:
        this.configService.get<string>('CLOUDINARY_API_SECRET') ||
        'wyFx7nLOJL1TESO1XThXbcO2wY0',
    });
    this.configurado = true;
  }

  private validar(
    file: Express.Multer.File | undefined,
    opciones: SubirArchivoOpciones,
  ): Buffer {
    if (!file || file.size <= 0) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    if (file.size > LIMITE_ARCHIVO_BYTES) {
      throw new BadRequestException({
        mensaje: 'El archivo no puede superar 5 MB.',
      });
    }

    const extension = this.resolveExtension(file.originalname);
    if (!extension || !opciones.extensionesPermitidas.has(extension)) {
      throw new BadRequestException({
        mensaje: opciones.mensajeFormatoInvalido,
      });
    }

    const buffer = this.obtenerBuffer(file);
    if (!buffer.length) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    return buffer;
  }

  private obtenerBuffer(file: Express.Multer.File): Buffer {
    if (file.buffer && file.buffer.length > 0) {
      return Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer);
    }

    if (file.path) {
      return readFileSync(file.path);
    }

    return Buffer.alloc(0);
  }

  private detalleError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private resolveExtension(fileName: string): string {
    const index = fileName.lastIndexOf('.');
    return index < 0 ? '' : fileName.slice(index).toLowerCase();
  }
}
