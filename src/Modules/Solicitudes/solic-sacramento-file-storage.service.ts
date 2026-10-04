import { Injectable } from '@nestjs/common';
import {
  CloudinaryStorageService,
  EXTENSIONES_IMAGEN,
} from '../../Common/Storage/cloudinary-storage.service';

@Injectable()
export class SolicSacramentoFileStorageService {
  constructor(private readonly storage: CloudinaryStorageService) {}

  saveSolicSacramentoImage(file: Express.Multer.File): Promise<string> {
    return this.storage.subirArchivo(file, {
      carpeta: 'solic-sacramento',
      extensionesPermitidas: EXTENSIONES_IMAGEN,
      mensajeFormatoInvalido: 'Formato no permitido. Use JPG, PNG, WEBP o GIF.',
      mensajeErrorSubida: 'No se pudo subir la imagen, intente de nuevo.',
      mimeType: file.mimetype,
    });
  }
}
