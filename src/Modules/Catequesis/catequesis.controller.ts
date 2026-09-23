import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Response } from 'express';
import { CatequesisService } from './catequesis.service';
import { CatequesisExportService } from './catequesis-export.service';
import { CatequesisFileStorageService } from './catequesis-file-storage.service';
import {
  ActualizarEstadoInscripcionDto,
  CrearInscripcionCatequesisDto,
} from './DTO/crear-inscripcion-catequesis.dto';
import { ConsultarInscripcionesDto } from './DTO/consultar-inscripciones.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';
import { Role } from '../../Common/Enums/Roles';
import {
  MENSAJE_ESTADO_INVALIDO,
  MENSAJE_FILIAL_INVALIDA,
  MENSAJE_ID_INVALIDO,
  MENSAJE_NIVEL_INVALIDO,
  MENSAJE_NO_ENCONTRADO,
  esIdValido,
  normalizarEstadoInscripcion,
  normalizarFilialInscripcion,
  normalizarNivelInscripcion,
} from '../../Common/Utils/inscripcion-catequesis-validaciones';

const LIMITE_ARCHIVOS_CATEQUESIS = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('inscripciones-catequesis')
export class CatequesisController {
  constructor(
    private readonly catequesisService: CatequesisService,
    private readonly catequesisExportService: CatequesisExportService,
    private readonly fileStorageService: CatequesisFileStorageService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query() filtros: ConsultarInscripcionesDto) {
    return this.catequesisService.findAll(filtros);
  }

  @Get('historial')
  @Roles(Role.ADMIN)
  async historial(
    @Query('estado') estado?: string,
    @Query('encargado') encargado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;

    if (
      desde !== undefined &&
      (!regexFecha.test(desde) || Number.isNaN(new Date(desde).getTime()))
    ) {
      throw new BadRequestException({
        mensaje: 'El formato de fecha no es válido, usá YYYY-MM-DD',
      });
    }
    if (
      hasta !== undefined &&
      (!regexFecha.test(hasta) || Number.isNaN(new Date(hasta).getTime()))
    ) {
      throw new BadRequestException({
        mensaje: 'El formato de fecha no es válido, usá YYYY-MM-DD',
      });
    }
    if (desde && hasta) {
      const fechaDesde = new Date(desde).getTime();
      const fechaHasta = new Date(hasta).getTime();
      if (fechaDesde > fechaHasta) {
        throw new BadRequestException({
          mensaje: 'La fecha de inicio no puede ser mayor que la fecha de fin',
        });
      }
    }
    if (
      estado !== undefined &&
      estado.trim() !== '' &&
      !['aprobado', 'aprobada', 'rechazado', 'rechazada'].includes(
        estado.trim().toLowerCase(),
      )
    ) {
      throw new BadRequestException({
        mensaje: 'El estado ingresado no es válido. Usá aprobado o rechazado',
      });
    }

    return this.catequesisService.historial({
      estado: estado?.trim() || undefined,
      encargado: encargado?.trim() || undefined,
      desde,
      hasta,
    });
  }

  @Get('exportar')
  @Roles(Role.ADMIN)
  async exportar(
    @Query('estado') estado: string | undefined,
    @Query('nivel') nivel: string | undefined,
    @Query('filial') filial: string | undefined,
    @Res() response: Response,
  ) {
    const estadoNormalizado = this.filtroExportacion(
      estado,
      normalizarEstadoInscripcion,
      MENSAJE_ESTADO_INVALIDO,
    );
    const nivelNormalizado = this.filtroExportacion(
      nivel,
      normalizarNivelInscripcion,
      MENSAJE_NIVEL_INVALIDO,
    );
    const filialNormalizada = this.filtroExportacion(
      filial,
      normalizarFilialInscripcion,
      MENSAJE_FILIAL_INVALIDA,
    );

    try {
      const { buffer, fileName } = await this.catequesisExportService.exportar(
        {
          estado: estadoNormalizado,
          nivel: nivelNormalizado,
          filial: filialNormalizada,
        },
      );

      response.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
      response.send(buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        mensaje: 'No se pudo generar el archivo de exportación.',
      });
    }
  }

  @Public()
  @Get('consulta')
  async consultarPorCorreo(@Query('correo') correo: string) {
    if (!correo?.trim()) {
      throw new BadRequestException({
        mensaje: 'El correo es obligatorio para la consulta.',
      });
    }

    const inscripciones = await this.catequesisService.findByCorreoSolicitante(
      correo.trim(),
    );

    return {
      inscripciones,
      total: inscripciones.length,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    if (!esIdValido(id)) {
      throw new BadRequestException({ mensaje: MENSAJE_ID_INVALIDO });
    }

    const inscripcion = await this.catequesisService.findById(id);
    if (!inscripcion) {
      throw new NotFoundException({ mensaje: MENSAJE_NO_ENCONTRADO });
    }

    return inscripcion;
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CrearInscripcionCatequesisDto) {
    try {
      return await this.catequesisService.create(body);
    } catch (error) {
      this.rethrowAsBadRequest(error);
    }
  }

  @Public()
  @Post('con-archivos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'FeBautismoArchivo', maxCount: 1 },
        { name: 'ComprobanteArchivo', maxCount: 1 },
      ],
      LIMITE_ARCHIVOS_CATEQUESIS,
    ),
  )
  async createWithFiles(
    @Body('Payload') payload: string,
    @UploadedFiles()
    files: {
      FeBautismoArchivo?: Express.Multer.File[];
      ComprobanteArchivo?: Express.Multer.File[];
    },
  ) {
    if (!payload?.trim()) {
      throw new BadRequestException({
        mensaje: 'Los datos de la inscripción son obligatorios.',
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException({
        mensaje: 'El formato de los datos de inscripción no es válido.',
      });
    }

    try {
      const feBautismoArchivo = files.FeBautismoArchivo?.[0];
      const comprobanteArchivo = files.ComprobanteArchivo?.[0];

      if (!feBautismoArchivo) {
        throw new BadRequestException({
          mensaje: 'La fe de bautismo es obligatoria.',
        });
      }

      if (!comprobanteArchivo) {
        throw new BadRequestException({
          mensaje: 'El comprobante de pago es obligatorio.',
        });
      }

      const requestObject = parsed as CrearInscripcionCatequesisDto;
      requestObject.datosInscripcion.feBautismoArchivo =
        await this.fileStorageService.saveCatequesisFile(
          feBautismoArchivo,
          'fe-bautismo',
        );
      requestObject.datosPago.comprobanteArchivo =
        await this.fileStorageService.saveCatequesisFile(
          comprobanteArchivo,
          'comprobante',
        );

      const dto = await this.validateDto(
        CrearInscripcionCatequesisDto,
        requestObject,
      );
      return await this.catequesisService.create(dto);
    } catch (error) {
      this.rethrowAsBadRequest(error);
    }
  }

  @Put(':id/estado')
  @Roles(Role.ADMIN)
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarEstadoInscripcionDto,
    @Req() req: RequestWithUser,
  ) {
    if (!esIdValido(id)) {
      throw new BadRequestException({ mensaje: MENSAJE_ID_INVALIDO });
    }

    const dto = await this.validateDto(ActualizarEstadoInscripcionDto, body);
    const estadoNormalizado = normalizarEstadoInscripcion(dto.estado);

    if (!estadoNormalizado) {
      throw new BadRequestException({ mensaje: MENSAJE_ESTADO_INVALIDO });
    }

    const response = await this.catequesisService.updateEstado(
      id,
      estadoNormalizado,
      dto.observacion,
      req.user.sub,
    );

    if (!response) {
      throw new NotFoundException({ mensaje: MENSAJE_NO_ENCONTRADO });
    }

    return response;
  }

  private async validateDto<T extends object>(
    cls: new () => T,
    plain: object,
  ): Promise<T> {
    const dto = plainToInstance(cls, plain, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.buildValidationResponse(errors));
    }

    return dto;
  }

  private buildValidationResponse(
    errors: Awaited<ReturnType<typeof validate>>,
  ): { mensaje: string; errores: Record<string, string[]> } {
    const errores: Record<string, string[]> = {};

    const collect = (
      validationErrors: Awaited<ReturnType<typeof validate>>,
      parent = '',
    ) => {
      for (const error of validationErrors) {
        const property = parent
          ? `${parent}.${error.property}`
          : error.property;

        if (error.constraints) {
          errores[property] = Object.values(error.constraints);
        }

        if (error.children?.length) {
          collect(error.children, property);
        }
      }
    };

    collect(errors);

    const mensaje =
      Object.values(errores).flat()[0] ?? 'Errores de validación.';

    return { mensaje, errores };
  }

  private rethrowAsBadRequest(error: unknown): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo procesar la solicitud.';
    throw new BadRequestException({ mensaje: message });
  }

  private filtroExportacion(
    valor: string | undefined,
    normalizar: (texto?: string | null) => string | null,
    mensajeInvalido: string,
  ): string | undefined {
    if (!valor?.trim() || valor.trim().toLowerCase() === 'todos') {
      return undefined;
    }

    const normalizado = normalizar(valor);
    if (!normalizado) {
      throw new BadRequestException({ mensaje: mensajeInvalido });
    }

    return normalizado;
  }
}
