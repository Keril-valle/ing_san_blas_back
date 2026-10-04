import { Injectable } from '@nestjs/common';
import {
  CloudinaryStorageService,
  EXTENSIONES_IMAGEN,
} from '../../Common/Storage/cloudinary-storage.service';

@Injectable()
export class EventoFileStorageService {
  constructor(private readonly storage: CloudinaryStorageService) {}

  saveEventoImage(file: Express.Multer.File): Promise<string> {
    return this.storage.subirArchivo(file, {
      carpeta: 'eventos',
      extensionesPermitidas: EXTENSIONES_IMAGEN,
      mensajeFormatoInvalido: 'Formato no permitido. Use JPG, PNG, WEBP o GIF.',
      mensajeErrorSubida: 'No se pudo subir la imagen, intente de nuevo.',
    });
  }
}
