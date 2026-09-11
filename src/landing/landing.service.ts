import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import {
  UpdateBautizosDto,
  UpdateContactoDto,
  UpdateHeroDto,
  UpdateHistoriaDto,
  UpdateHorariosDto,
  UpdateSobreNosotrosDto,
} from './DTO/update-landing-section.dto';
import { LandingSection } from './Entities/landing-section.entity';
import { LandingFileStorageService } from './landing-file-storage.service';
import { mapValidationErrors } from '../Common/validation-errors';

export const LANDING_SECTION_KEYS = [
  'hero',
  'sobre-nosotros',
  'historia',
  'contacto',
  'horarios',
  'bautizos',
] as const;

export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[number];

const HERO_DEFAULT: UpdateHeroDto = {
  subtitle: 'Desde 1544',
  title: 'Firme en la',
  titleHighlight: 'Fe y Tradición',
  description:
    'Ubicada en el corazón de Nicoya, la Parroquia San Blas es testimonio vivo de nuestra historia y esperanza cristiana.',
};

const SOBRE_NOSOTROS_DEFAULT: UpdateSobreNosotrosDto = {
  eyebrow: 'Sobre Nosotros',
  title: 'Una parroquia que guarda la fe, la historia y la cercanía de Nicoya',
  lead: 'La Parroquia San Blas de Nicoya es un referente espiritual y cultural de Costa Rica. Su historia, su misión pastoral y su vocación de servicio siguen acompañando a una comunidad viva, hospitalaria y profundamente creyente.',
  cards: [
    {
      icono: '01',
      titulo: 'Raíz histórica',
      texto:
        'La Parroquia San Blas ha acompañado la vida espiritual de Nicoya desde sus orígenes, siendo parte esencial de la memoria religiosa y cultural de Costa Rica.',
    },
    {
      icono: '02',
      titulo: 'Identidad cultural',
      texto:
        'Su presencia ha contribuido a preservar tradiciones, celebraciones y expresiones de fe que fortalecen el sentido de pertenencia de la comunidad nicoyana.',
    },
    {
      icono: '03',
      titulo: 'Misión espiritual',
      texto:
        'Nuestra misión es anunciar el Evangelio, celebrar los sacramentos y sostener la fe del pueblo con una pastoral cercana, serena y comprometida.',
    },
    {
      icono: '04',
      titulo: 'Servicio a la comunidad',
      texto:
        'Acompañamos a niños, jóvenes, adultos mayores y familias con catequesis, formación y espacios de servicio que buscan unir fe y vida diaria.',
    },
  ],
};

const HISTORIA_DEFAULT: UpdateHistoriaDto = {
  eyebrow: 'Raíces de Fe',
  subtitle: 'Un tesoro colonial en el corazón de Guanacaste',
  origenes:
    'La Parroquia de San Blas, ubicada en el majestuoso cantón de Nicoya, es más que una edificación religiosa; es un símbolo indeleble de la historia colonial de Costa Rica y de la profunda devoción que caracteriza a la región Chorotega. Con orígenes que se remontan al año 1544, esta iglesia se consolida como una de las parroquias más antiguas y valiosas del país.',
  restauraciones:
    'A lo largo de los siglos, estos muros han sido testigos silenciosos del paso del tiempo. Diversos eventos naturales han puesto a prueba la fortaleza del templo, motivando importantes labores de restauración que han reafirmado la perseverancia y fe inquebrantable de la comunidad nicoyana a través de las generaciones.',
  cita: '"Un espacio donde nuestra tradición ancestral se encuentra con la paz espiritual."',
  fachada:
    'Su inconfundible fachada, su armazón de cálidos tonos blancos y su imponente techo resguardan elementos invaluables que entrelazan la influencia indígena y española. Esta mezcla se respira en cada rincón, desde el campanario hasta los históricos retablos de su interior.',
  invitacion:
    'Hoy en día, la Parroquia San Blas mantiene sus puertas abiertas y su vocación firme. Invitamos a todos los feligreses y visitantes a caminar por sus naves, sentir el legado histórico que descansa bajo su techo colonial y acompañarnos en esta gran misión espiritual.',
  videoUrl: 'https://www.youtube.com/embed/KWFL_AS5Xlk',
};

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

    if (sectionKey === 'hero') {
      return {
        sectionKey: 'hero',
        data: { ...HERO_DEFAULT },
        updatedAt: null,
      };
    }

    if (sectionKey === 'sobre-nosotros') {
      return {
        sectionKey: 'sobre-nosotros',
        data: {
          ...SOBRE_NOSOTROS_DEFAULT,
          cards: SOBRE_NOSOTROS_DEFAULT.cards.map((card) => ({ ...card })),
        },
        updatedAt: null,
      };
    }

    if (sectionKey === 'historia') {
      return {
        sectionKey: 'historia',
        data: { ...HISTORIA_DEFAULT },
        updatedAt: null,
      };
    }

    return {
      sectionKey,
      data: {},
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

    if (sectionKey === 'hero' || sectionKey === 'sobre-nosotros') {
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

    section.data = current;
    const saved = await this.landingRepository.save(section);
    return this.toResponse(saved);
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
    };
  }
}
