import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  Logger,
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
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';
import { SUBIDA_ARCHIVO_MEMORIA } from '../../Common/Storage/subida-archivo.options';
import {
  parsearPayloadJson,
  validarPayloadMultipart,
} from '../../Common/Utils/multipart-payload';
import { rethrowComoBadRequest } from '../../Common/Utils/excepciones-http';
import { validarRangoFechas } from '../../Common/Utils/validar-rango-fechas';
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

const ESTADOS_HISTORIAL = ['aprobado', 'aprobada', 'rechazado', 'rechazada'];

// Valor provisional para los campos que el DTO exige y que recién se completan
// con la URL real después de subir el archivo.
const MARCADOR_ARCHIVO_PENDIENTE = 'pendiente-de-subida';

@Controller('inscripciones-catequesis')
export class CatequesisController {
  private readonly logger = new Logger(CatequesisController.name);

  constructor(
    private readonly catequesisService: CatequesisService,
    private readonly catequesisExportService: CatequesisExportService,
    private readonly fileStorageService: CatequesisFileStorageService,
  ) {}

  @Get()
  @Permisos('catequesis')
  async findAll(@Query() filtros: ConsultarInscripcionesDto) {
    return this.catequesisService.findAll(filtros);
  }

  @Get('historial')
  @Permisos('catequesis')
  async historial(
    @Query('estado') estado?: string,
    @Query('encargado') encargado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    this.validarFiltrosHistorial(desde, hasta, estado);

    return this.catequesisService.historial({
      estado: estado?.trim() || undefined,
      encargado: encargado?.trim() || undefined,
      desde,
      hasta,
    });
  }

  /** Valida el rango de fechas y el estado usados por el historial. */
  private validarFiltrosHistorial(
    desde?: string,
    hasta?: string,
    estado?: string,
  ): void {
    validarRangoFechas(desde, hasta);

    const estadoNormalizado = estado?.trim().toLowerCase();
    if (estadoNormalizado && !ESTADOS_HISTORIAL.includes(estadoNormalizado)) {
      throw new BadRequestException({
        mensaje: 'El estado ingresado no es válido. Usá aprobado o rechazado',
      });
    }
  }

  @Get('exportar')
  @Permisos('catequesis')
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
      const { buffer, fileName } = await this.catequesisExportService.exportar({
        estado: estadoNormalizado,
        nivel: nivelNormalizado,
        filial: filialNormalizada,
      });

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
      this.logger.error(
        'No se pudo generar el archivo de exportación de catequesis',
        error instanceof Error ? error.stack : String(error),
      );
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
  @Permisos('catequesis')
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
      rethrowComoBadRequest(error);
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
      SUBIDA_ARCHIVO_MEMORIA,
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
    const parsed = parsearPayloadJson<CrearInscripcionCatequesisDto>(payload, {
      vacio: 'Los datos de la inscripción son obligatorios.',
      invalido: 'El formato de los datos de inscripción no es válido.',
    });

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

      // Un JSON bien formado puede venir incompleto: si falta una sección,
      // escribir sobre ella lanzaría un TypeError de JavaScript que llegaría
      // al usuario como un 400 con mensaje técnico. Se comprueba antes.
      this.exigirSeccion(
        parsed,
        'datosInscripcion',
        'Faltan los datos de la inscripción.',
      );
      this.exigirSeccion(parsed, 'datosPago', 'Faltan los datos del pago.');

      // El DTO exige las dos rutas de archivo: se validan con un marcador para
      // revisar el resto de los datos ANTES de subir y así no dejar archivos
      // huérfanos cuando el payload es inválido.
      parsed.datosInscripcion.feBautismoArchivo = MARCADOR_ARCHIVO_PENDIENTE;
      parsed.datosPago.comprobanteArchivo = MARCADOR_ARCHIVO_PENDIENTE;

      const dto = await validarPayloadMultipart(
        parsed,
        CrearInscripcionCatequesisDto,
      );

      const [feBautismoUrl, comprobanteUrl] = await Promise.all([
        this.fileStorageService.saveCatequesisFile(
          feBautismoArchivo,
          'fe-bautismo',
        ),
        this.fileStorageService.saveCatequesisFile(
          comprobanteArchivo,
          'comprobante',
        ),
      ]);
      dto.datosInscripcion.feBautismoArchivo = feBautismoUrl;
      dto.datosPago.comprobanteArchivo = comprobanteUrl;

      return await this.catequesisService.create(dto);
    } catch (error) {
      rethrowComoBadRequest(error);
    }
  }

  @Put(':id/estado')
  @Permisos('catequesis')
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarEstadoInscripcionDto,
    @Req() req: RequestWithUser,
  ) {
    if (!esIdValido(id)) {
      throw new BadRequestException({ mensaje: MENSAJE_ID_INVALIDO });
    }

    const estadoNormalizado = normalizarEstadoInscripcion(body.estado);

    if (!estadoNormalizado) {
      throw new BadRequestException({ mensaje: MENSAJE_ESTADO_INVALIDO });
    }

    const response = await this.catequesisService.updateEstado(
      id,
      estadoNormalizado,
      body.observacion,
      req.user.sub,
    );

    if (!response) {
      throw new NotFoundException({ mensaje: MENSAJE_NO_ENCONTRADO });
    }

    return response;
  }

  /** Garantiza que una sección del payload exista antes de usarla. */
  private exigirSeccion(
    parsed: unknown,
    clave: keyof CrearInscripcionCatequesisDto,
    mensaje: string,
  ): void {
    const raiz = parsed as Partial<CrearInscripcionCatequesisDto> | null;
    const seccion = raiz?.[clave];
    if (!seccion || typeof seccion !== 'object') {
      throw new BadRequestException({ mensaje });
    }
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
