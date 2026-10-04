import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository, In } from 'typeorm';
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
      createdAt: null,
    };
  }

  async update(
    sectionKey: string,
    data: object,
    archivos: {
      imagen?: Express.Multer.File;
      encabezado?: Express.Multer.File;
      cita?: Express.Multer.File;
      servicios?: Record<string, Express.Multer.File>;
    } = {},
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
      await this.aplicarImagen(
        current,
        'imageUrl',
        archivos.imagen,
        payload.eliminarImagen,
        sectionKey,
      );
      delete current.eliminarImagen;
    }

    if (sectionKey === 'historia') {
      await Promise.all([
        this.aplicarImagen(
          current,
          'headerImageUrl',
          archivos.encabezado,
          payload.eliminarHeaderImagen,
          'historia',
          'encabezado',
        ),
        this.aplicarImagen(
          current,
          'quoteImageUrl',
          archivos.cita,
          payload.eliminarQuoteImagen,
          'historia',
          'cita',
        ),
      ]);

      delete current.eliminarHeaderImagen;
      delete current.eliminarQuoteImagen;
    }

    // cada servicio puede traer su propia imagen (archivoServicio1..N)
    if (sectionKey === 'servicios' && archivos.servicios) {
      const items = Array.isArray(current.items)
        ? (current.items as Array<Record<string, unknown>>)
        : [];

      const subidas: Array<Promise<void>> = [];
      for (const [campo, file] of Object.entries(archivos.servicios)) {
        if (!file) continue;
        const match = /^archivoServicio(\d+)$/.exec(campo);
        if (!match) continue;
        const index = Number(match[1]) - 1;
        if (index < 0 || index >= items.length) continue;
        subidas.push(
          this.fileStorageService
            .saveSectionImage(file, 'servicios', `item-${index + 1}`)
            .then((url) => {
              items[index].imageUrl = url;
            }),
        );
      }
      await Promise.all(subidas);

      current.items = items;
    }

    section.data = current;
    const saved = await this.landingRepository.save(section);
    return this.toResponse(saved);
  }

  // Sube la imagen nueva o borra la guardada según la bandera del payload.
  private async aplicarImagen(
    destino: Record<string, unknown>,
    campo: string,
    archivo: Express.Multer.File | undefined,
    quiereEliminar: unknown,
    seccion: 'hero' | 'sobre-nosotros' | 'historia' | 'horarios' | 'servicios',
    variante = 'imagen',
  ) {
    if (archivo) {
      destino[campo] = await this.fileStorageService.saveSectionImage(
        archivo,
        seccion,
        variante,
      );
    } else if (quiereEliminar) {
      delete destino[campo];
    }
  }

  // Restablece una o varias secciones a su configuración por defecto.
  // Sin `sectionKeys` restablece todas; con array, solo las indicadas.
  async restablecer(sectionKeys?: string[]) {
    const claves: LandingSectionKey[] = sectionKeys?.length
      ? (sectionKeys as LandingSectionKey[])
      : [...LANDING_SECTION_KEYS];

    // valida todas antes de tocar la base pa no dejar un reset a medias
    claves.forEach((clave) => this.assertSectionKey(clave));

    const existentes = await this.landingRepository.find({
      where: { sectionKey: In(claves) },
    });
    const porClave = new Map(
      existentes.map((seccion) => [seccion.sectionKey, seccion]),
    );

    const restablecidas = claves.map((sectionKey) => {
      const section =
        porClave.get(sectionKey) ??
        this.landingRepository.create({ sectionKey });
      // el default ya trae la imagen original de Cloudinary, así que el reset
      // también restaura la imagen (no solo los textos)
      section.data = clonarDefault(sectionKey) as Record<string, unknown>;
      return section;
    });

    // una sola transacción: si algo falla, no queda el reset a medias
    await this.landingRepository.manager.transaction(async (manager) => {
      await manager.save(LandingSection, restablecidas);
    });

    return restablecidas.map((seccion) => this.toResponse(seccion));
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
