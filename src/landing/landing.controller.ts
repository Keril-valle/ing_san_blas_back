import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ValidationError } from 'class-validator';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { Public } from '../Auth/Decorators/public.decorator';
import { Roles } from '../Auth/Decorators/roles.decorator';
import { Role } from '../Common/Enums/Roles';
import { mapValidationErrors } from '../Common/validation-errors';
import {
  UpdateBautizosDto,
  UpdateContactoDto,
  UpdateHeroDto,
  UpdateHistoriaDto,
  UpdateHorariosDto,
  UpdateSobreNosotrosDto,
} from './DTO/update-landing-section.dto';
import { LandingService } from './landing.service';

const LIMITE_IMAGEN = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

const landingValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors: ValidationError[]) =>
    new BadRequestException(mapValidationErrors(errors)),
});

@Controller('landing')
@UsePipes(landingValidationPipe)
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Public()
  @Get()
  findAll() {
    return this.landingService.findAll();
  }

  @Put('hero')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateHero(@Body() dto: UpdateHeroDto) {
    return this.landingService.update('hero', dto);
  }

  @Put('hero/con-imagen')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_IMAGEN))
  updateHeroWithImage(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.landingService.update('hero', this.leerPayload(req), archivo);
  }

  @Put('sobre-nosotros')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateSobreNosotros(@Body() dto: UpdateSobreNosotrosDto) {
    return this.landingService.update('sobre-nosotros', dto);
  }

  @Put('sobre-nosotros/con-imagen')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_IMAGEN))
  updateSobreNosotrosWithImage(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.landingService.update(
      'sobre-nosotros',
      this.leerPayload(req),
      archivo,
    );
  }

  @Put('historia')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateHistoria(@Body() dto: UpdateHistoriaDto) {
    return this.landingService.update('historia', dto);
  }

  @Put('historia/con-imagen')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'archivoEncabezado', maxCount: 1 },
        { name: 'archivoCita', maxCount: 1 },
      ],
      LIMITE_IMAGEN,
    ),
  )
  updateHistoriaWithImage(
    @Req() req: Request,
    @UploadedFiles()
    archivos?: {
      archivoEncabezado?: Express.Multer.File[];
      archivoCita?: Express.Multer.File[];
    },
  ) {
    return this.landingService.update(
      'historia',
      this.leerPayload(req),
      undefined,
      {
        headerImageUrl: archivos?.archivoEncabezado?.[0],
        quoteImageUrl: archivos?.archivoCita?.[0],
      },
    );
  }

  @Put('contacto')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateContacto(@Body() dto: UpdateContactoDto) {
    return this.landingService.update('contacto', dto);
  }

  @Put('horarios')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateHorarios(@Body() dto: UpdateHorariosDto) {
    return this.landingService.update('horarios', dto);
  }

  @Put('bautizos')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateBautizos(@Body() dto: UpdateBautizosDto) {
    return this.landingService.update('bautizos', dto);
  }

  @Public()
  @Get(':sectionKey')
  findOne(@Param('sectionKey') sectionKey: string) {
    return this.landingService.findOne(sectionKey);
  }

  private leerPayload(req: Request): Record<string, unknown> {
    const payload = (req.body as { Payload?: string } | undefined)?.Payload;
    if (!payload?.trim()) {
      throw new BadRequestException({
        mensaje: 'Los datos de la sección son obligatorios.',
      });
    }

    try {
      const parsed = JSON.parse(payload) as { data?: Record<string, unknown> };
      if (parsed && typeof parsed.data === 'object' && parsed.data) {
        return parsed.data;
      }
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      throw new Error('invalid');
    } catch {
      throw new BadRequestException({
        mensaje: 'El formato de los datos de la sección no es válido.',
      });
    }
  }
}
