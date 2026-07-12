import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

@Injectable()
export class CatequesisFileStorageService {
  private readonly logger = new Logger(CatequesisFileStorageService.name);
  private readonly uploadRoot: string;
  private readonly maxFileSizeBytes: number;
  private readonly storageAvailable: boolean;

  constructor(private readonly configService: ConfigService) {
    const uploadPath =
      this.configService.get<string>('app.uploadPath') ?? './uploads';
    this.uploadRoot = join(process.cwd(), uploadPath);
    const maxMb = this.configService.get<number>('app.uploadMaxSizeMb') ?? 5;
    this.maxFileSizeBytes = maxMb * 1024 * 1024;

    // Intentamos crear el directorio, si falla (Vercel = read-only) seguimos sin crash
    let available = false;
    try {
      mkdirSync(this.uploadRoot, { recursive: true });
      available = true;
    } catch {
      this.logger.warn(
        `No se pudo crear ${this.uploadRoot} — el almacenamiento de archivos no estará disponible (probablemente Vercel).`,
      );
    }
    this.storageAvailable = available;
  }

  async saveCatequesisFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<string> {
    if (!this.storageAvailable) {
      throw new BadRequestException({
        mensaje:
          'El almacenamiento de archivos no está disponible en este entorno.',
      });
    }

    if (!file || file.size <= 0) {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException({
        mensaje: 'El archivo no puede superar 5 MB.',
      });
    }

    const extension = this.resolveExtension(file.originalname);
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException({
        mensaje: 'Formato no permitido. Use PDF, JPG, PNG o WEBP.',
      });
    }

    const safeCategory = category?.trim().toLowerCase() || 'general';
    const targetDir = join(this.uploadRoot, 'catequesis', safeCategory);
    mkdirSync(targetDir, { recursive: true });

    const storedName = `${randomBytes(16).toString('hex')}${extension}`;
    const absolutePath = join(targetDir, storedName);

    if (file.buffer?.length) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(absolutePath, file.buffer);
    } else if (file.path && existsSync(file.path)) {
      const { copyFile, unlink } = await import('node:fs/promises');
      await copyFile(file.path, absolutePath);
      await unlink(file.path).catch(() => undefined);
    } else if (file.stream) {
      await pipeline(
        Readable.from(file.stream),
        createWriteStream(absolutePath),
      );
    } else {
      throw new BadRequestException({ mensaje: 'El archivo está vacío.' });
    }

    return `catequesis/${safeCategory}/${storedName}`;
  }

  private resolveExtension(fileName: string): string | null {
    const index = fileName.lastIndexOf('.');
    if (index < 0) {
      return null;
    }

    return fileName.slice(index).toLowerCase();
  }
}
