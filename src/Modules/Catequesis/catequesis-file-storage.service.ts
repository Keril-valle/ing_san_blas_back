import { Injectable } from '@nestjs/common';
import {
  CloudinaryStorageService,
  EXTENSIONES_IMAGEN_O_PDF,
} from '../../Common/Storage/cloudinary-storage.service';

@Injectable()
export class CatequesisFileStorageService {
  constructor(private readonly storage: CloudinaryStorageService) {}

  saveCatequesisFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<string> {
    const safeCategory = category?.trim().toLowerCase() || 'general';
    const esPdf = file.originalname.toLowerCase().endsWith('.pdf');

    return this.storage.subirArchivo(file, {
      carpeta: `catequesis/${safeCategory}`,
      extensionesPermitidas: EXTENSIONES_IMAGEN_O_PDF,
      mensajeFormatoInvalido: 'Formato no permitido. Use PDF, JPG, PNG o WEBP.',
      mensajeErrorSubida: 'No se pudo subir el archivo, intente de nuevo.',
      mimeType: esPdf
        ? 'application/pdf'
        : file.mimetype || `image/${this.extension(file.originalname)}`,
      recurso: esPdf ? 'raw' : 'image',
      ...(esPdf ? { formato: 'pdf' } : {}),
    });
  }

  private extension(fileName: string): string {
    const index = fileName.lastIndexOf('.');
    return index < 0 ? '' : fileName.slice(index + 1).toLowerCase();
  }
}
