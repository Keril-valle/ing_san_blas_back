import { Injectable } from '@nestjs/common';
import {
  CloudinaryStorageService,
  EXTENSIONES_IMAGEN_SIN_GIF,
} from '../Common/Storage/cloudinary-storage.service';

@Injectable()
export class LandingFileStorageService {
  constructor(private readonly storage: CloudinaryStorageService) {}

  saveSectionImage(
    file: Express.Multer.File,
    sectionKey:
      'hero' | 'sobre-nosotros' | 'historia' | 'horarios' | 'servicios',
    variante = 'imagen',
  ): Promise<string> {
    return this.storage.subirArchivo(file, {
      carpeta: `landing/${sectionKey}/${variante}`,
      extensionesPermitidas: EXTENSIONES_IMAGEN_SIN_GIF,
      mensajeFormatoInvalido: 'Formato no permitido. Use JPG, PNG o WEBP.',
      mensajeErrorSubida: 'No se pudo subir la imagen, intente de nuevo.',
    });
  }
}
