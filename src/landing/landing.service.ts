import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import {
  UpdateBautizosDto,
  UpdateContactoDto,
  UpdateDonacionesDto,
  UpdateHeroDto,
  UpdateHistoriaDto,
  UpdateHorariosDto,
  UpdateServiciosDto,
  UpdateSobreNosotrosDto,
} from './DTO/update-landing-section.dto';
import { LandingSection } from './Entities/landing-section.entity';
import { LandingFileStorageService } from './landing-file-storage.service';
import {
  clonarDefault,
  LANDING_SECTION_KEYS,
  type LandingSectionKey,
} from './landing.defaults';
import { mapValidationErrors } from '../Common/validation-errors';

export { LANDING_SECTION_KEYS, type LandingSectionKey };

@Injectable()
export class LandingService {
  constructor(
    @InjectRepository(LandingSection)
    private readonly landingRepository: Repository<LandingSection>,
    private readonly fileStorageService: LandingFileStorageService,
  ) {}

  async findAll() {
    const sections = await this.landingRepository.find({
      order: { sectionKey: 'ASC' },
    });
    return sections.map((section) => this.toResponse(section));
  }

  async findOne(sectionKey: string) {
    this.assertSectionKey(sectionKey);
    const section = await this.landingRepository.findOne({
      where: { sectionKey },
    });

    if (section) {
      return this.toResponse(section);
    }

    // todavía no hay fila guardada: se devuelve el default de código
    return {
      sectionKey,
      data: clonarDefault(sectionKey),
      updatedAt: null,
    };
  }

  async update(
    sectionKey: string,
    data: object,
    archivo?: Express.Multer.File,
    archivosPorCampo?: Partial<
      Record<'headerImageUrl' | 'quoteImageUrl', Express.Multer.File>
    >,
    archivosServicios?: Record<string, Express.Multer.File | undefined>,
  ) {
    this.assertSectionKey(sectionKey);

    const payload: Record<string, unknown> = {
      ...(await this.normalizarSeccion(sectionKey, data)),
    };

    let section = await this.landingRepository.findOne({
      where: { sectionKey },
    });

    if (!section) {
      section = this.landingRepository.create({
        sectionKey,
        data: {},
      });
    }

    const current: Record<string, unknown> = {
      ...(section.data ?? {}),
      ...payload,
    };

    // la imagen de fondo se maneja igual que en el hero (Cloudinary o eliminar)
    if (
      sectionKey === 'hero' ||
      sectionKey === 'sobre-nosotros' ||
      sectionKey === 'horarios'
    ) {
      if (archivo) {
        current.imageUrl = await this.fileStorageService.saveSectionImage(
          archivo,
          sectionKey,
        );
      } else if (payload.eliminarImagen) {
        delete current.imageUrl;
      }
      delete current.eliminarImagen;
    }

    if (sectionKey === 'historia') {
      if (archivosPorCampo?.headerImageUrl) {
        current.headerImageUrl = await this.fileStorageService.saveSectionImage(
          archivosPorCampo.headerImageUrl,
          'historia',
          'encabezado',
        );
      } else if (payload.eliminarHeaderImagen) {
        delete current.headerImageUrl;
      }

      if (archivosPorCampo?.quoteImageUrl) {
        current.quoteImageUrl = await this.fileStorageService.saveSectionImage(
          archivosPorCampo.quoteImageUrl,
          'historia',
          'cita',
        );
      } else if (payload.eliminarQuoteImagen) {
        delete current.quoteImageUrl;
      }

      delete current.eliminarHeaderImagen;
      delete current.eliminarQuoteImagen;
    }

    // cada servicio puede traer su propia imagen (archivoServicio1..N)
    if (sectionKey === 'servicios' && archivosServicios) {
      const items = Array.isArray(current.items)
        ? (current.items as Array<Record<string, unknown>>)
        : [];

      for (const [campo, file] of Object.entries(archivosServicios)) {
        if (!file) continue;
        const match = /^archivoServicio(\d+)$/.exec(campo);
        if (!match) continue;
        const index = Number(match[1]) - 1;
        if (index < 0 || index >= items.length) continue;
        items[index].imageUrl = await this.fileStorageService.saveSectionImage(
          file,
          'servicios',
          `item-${index + 1}`,
        );
      }

      current.items = items;
    }

    section.data = current;
    const saved = await this.landingRepository.save(section);
    return this.toResponse(saved);
  }

  // Restablece una o varias secciones a su configuración por defecto.
  // Sin `sectionKeys` restablece todas; con array, solo las indicadas.
  async restablecer(sectionKeys?: string[]) {
    const claves: LandingSectionKey[] = sectionKeys?.length
      ? (sectionKeys as LandingSectionKey[])
      : [...LANDING_SECTION_KEYS];

    // valida todas antes de tocar la base pa no dejar un reset a medias
    claves.forEach((clave) => this.assertSectionKey(clave));

    const restablecidas: ReturnType<LandingService['toResponse']>[] = [];

    for (const sectionKey of claves) {
      // el default ya trae la imagen original de Cloudinary, así que el reset
      // también restaura la imagen (no solo los textos)
      const data = clonarDefault(sectionKey) as Record<string, unknown>;

      let section = await this.landingRepository.findOne({
        where: { sectionKey },
      });

      if (!section) {
        section = this.landingRepository.create({ sectionKey });
      }

      section.data = data;
      const saved = await this.landingRepository.save(section);
      restablecidas.push(this.toResponse(saved));
    }

    return restablecidas;
  }

  private async normalizarSeccion(
    sectionKey: LandingSectionKey,
    data: object,
  ): Promise<object> {
    switch (sectionKey) {
      case 'hero':
        return this.validarDto(UpdateHeroDto, data);
      case 'sobre-nosotros':
        return this.validarDto(UpdateSobreNosotrosDto, data);
      case 'historia':
        return this.validarDto(UpdateHistoriaDto, data);
      case 'contacto':
        return this.validarDto(UpdateContactoDto, data);
      case 'horarios':
        return this.validarDto(UpdateHorariosDto, data);
      case 'bautizos':
        return this.validarDto(UpdateBautizosDto, data);
      case 'servicios':
        return this.validarDto(UpdateServiciosDto, data);
      case 'donaciones':
        return this.validarDto(UpdateDonacionesDto, data);
      default: {
        const exhaustivo: never = sectionKey;
        throw new BadRequestException({
          mensaje: `La sección ${String(exhaustivo)} no admite actualización.`,
        });
      }
    }
  }

  private async validarDto<T extends object>(
    cls: ClassConstructor<T>,
    data: object,
  ): Promise<T> {
    const dto = plainToInstance(cls, data);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(mapValidationErrors(errors));
    }

    return dto;
  }

  private assertSectionKey(
    sectionKey: string,
  ): asserts sectionKey is LandingSectionKey {
    if (!LANDING_SECTION_KEYS.includes(sectionKey as LandingSectionKey)) {
      throw new BadRequestException({
        mensaje: 'La sección indicada no es válida.',
      });
    }
  }

  private toResponse(section: LandingSection) {
    return {
      sectionKey: section.sectionKey,
      data: section.data ?? {},
      updatedAt: section.updatedAt?.toISOString() ?? null,
      createdAt: section.createdAt?.toISOString() ?? null,
    };
  }
}
