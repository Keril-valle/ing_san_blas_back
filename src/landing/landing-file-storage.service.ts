import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Agent } from 'node:https';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const cloudinaryAgent = new Agent({ rejectUnauthorized: false });

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.pdf']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class LandingFileStorageService {
  private readonly logger = new Logger(LandingFileStorageService.name);

  constructor(private readonly configService: ConfigService) {
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
  }

  async saveSectionImage(
    file: Express.Multer.File,
    sectionKey:
      'hero' | 'sobre-nosotros' | 'historia' | 'horarios' | 'servicios',
    variante = 'imagen',
  ): Promise<string> {
    if (!file || file.size <= 0) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        mensaje: 'El archivo no puede superar 5 MB.',
      });
    }

    const extension = this.resolveExtension(file.originalname);
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException({
        mensaje: 'Formato no permitido. Use JPG, PNG o WEBP.',
      });
    }

    const buffer = this.obtenerBuffer(file);
    if (!buffer.length) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/${extension.slice(1)};base64,${buffer.toString('base64')}`,
        {
          public_id: `landing/${sectionKey}/${variante}/${randomBytes(12).toString('hex')}`,
          resource_type: 'image',
          agent: cloudinaryAgent,
        },
      );

      return uploadResult.secure_url ?? uploadResult.url;
    } catch (error) {
      const detalle = this.detalleError(error);
      this.logger.error(
        `Error subiendo imagen de ${sectionKey} a Cloudinary: ${detalle}`,
      );
      throw new BadRequestException({
        mensaje: 'No se pudo subir la imagen, intente de nuevo.',
      });
    }
  }

  // Sube un documento (PDF) a Cloudinary como recurso "raw": los PDF no son
  // imágenes, así que no pueden pasar por saveSectionImage.
  async saveSectionDocument(
    file: Express.Multer.File,
    sectionKey: string,
    variante = 'documento',
  ): Promise<string> {
    if (!file || file.size <= 0) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        mensaje: 'El archivo no puede superar 5 MB.',
      });
    }

    const extension = this.resolveExtension(file.originalname);
    if (!extension || !ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
      throw new BadRequestException({
        mensaje: 'Formato no permitido. Use PDF.',
      });
    }

    const buffer = this.obtenerBuffer(file);
    if (!buffer.length) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${buffer.toString('base64')}`,
        {
          // el .pdf en el public_id hace que la URL devuelta termine en .pdf
          public_id: `landing/${sectionKey}/${variante}/${randomBytes(12).toString('hex')}.pdf`,
          resource_type: 'raw',
          agent: cloudinaryAgent,
        },
      );

      return uploadResult.secure_url ?? uploadResult.url;
    } catch (error) {
      const detalle = this.detalleError(error);
      this.logger.error(
        `Error subiendo documento de ${sectionKey} a Cloudinary: ${detalle}`,
      );
      throw new BadRequestException({
        mensaje: 'No se pudo subir el PDF, intente de nuevo.',
      });
    }
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

  private resolveExtension(fileName: string): string | null {
    const index = fileName.lastIndexOf('.');
    if (index < 0) {
      return null;
    }

    return fileName.slice(index).toLowerCase();
  }
}
