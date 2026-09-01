import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomBytes } from 'node:crypto';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class SolicSacramentoFileStorageService {
  private readonly logger = new Logger(SolicSacramentoFileStorageService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name:
        this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ?? 'rbrda5nv',
      api_key:
        this.configService.get<string>('CLOUDINARY_API_KEY') ??
        '915513564946372',
      api_secret:
        this.configService.get<string>('CLOUDINARY_API_SECRET') ??
        'wyFx7nLOJL1TESO1XThXbcO2wY0',
    });
  }

  async saveSolicSacramentoImage(file: Express.Multer.File): Promise<string> {
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
        mensaje: 'Formato no permitido. Use JPG, PNG, WEBP o GIF.',
      });
    }

    const publicId = `solic-sacramento/${randomBytes(12).toString('hex')}`;

    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          public_id: publicId,
          resource_type: 'image',
        },
      );

      return uploadResult.secure_url ?? uploadResult.url;
    } catch (error) {
      this.logger.error(
        'Error subiendo imagen a Cloudinary',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException({
        mensaje: 'No se pudo subir la imagen, intente de nuevo.',
      });
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
