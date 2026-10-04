import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSolicSacramentoDto } from './DTO/create-solic-sacramento.dto';
import { SearchSolicSacramentoDto } from './DTO/search-solic-sacramento.dto';
import { BuscarSolicSacramentoDto } from './DTO/buscar-solic-sacramento.dto';
import { UpdateSolicSacramentoDto } from './DTO/update-solic-sacramento.dto';
import { SolicSacramento } from './Entities/solic-sacramento.entity';
import { HistorialRechazos } from './Entities/historial-rechazos.entity';
import { EstadoSolicitud } from '../../Common/Enums/EstadoSolicitud';
import {
  isEstadoArchivado,
  isEstadoPendiente,
} from '../../Common/Utils/estado-solicitud';
import { SolicSacramentoFileStorageService } from './solic-sacramento-file-storage.service';

/** Campos que se devuelven en los listados: evita cargar columnas de auditoría. */
const COLUMNAS_LISTADO = [
  'solic.id',
  'solic.PrimerNombre',
  'solic.SegundoNombre',
  'solic.PrimerApellido',
  'solic.SegundoApellido',
  'solic.Cedula',
  'solic.Correo',
  'solic.Telefono',
  'solic.Parroquia',
  'solic.Motivo',
  'solic.Estado',
  'solic.comprobanteUrl',
  'solic.FechaSolicitud',
  'solic.FechaArchivo',
];

/** El filtro del listado usa las variantes femeninas de los estados. */
const ESTADOS_DE_BUSQUEDA: Record<string, EstadoSolicitud> = {
  Pendiente: EstadoSolicitud.PENDIENTE,
  Aprobada: EstadoSolicitud.APROBADA,
  Rechazada: EstadoSolicitud.RECHAZADA,
  Archivada: EstadoSolicitud.ARCHIVADA,
};

@Injectable()
export class SolicSacramentoService {
  private readonly logger = new Logger(SolicSacramentoService.name);

  constructor(
    @InjectRepository(SolicSacramento)
    private readonly solicSacraRepository: Repository<SolicSacramento>,
    @InjectRepository(HistorialRechazos)
    private readonly historialRechazosRepository: Repository<HistorialRechazos>,
    private readonly fileStorageService: SolicSacramentoFileStorageService,
  ) {}

  async create(createSolicSacramentoDto: CreateSolicSacramentoDto) {
    return this.guardarSolicitud(createSolicSacramentoDto);
  }

  async createWithImage(
    createSolicSacramentoDto: CreateSolicSacramentoDto,
    archivo?: Express.Multer.File,
  ) {
    const comprobanteUrl = archivo
      ? await this.fileStorageService.saveSolicSacramentoImage(archivo)
      : undefined;

    return this.guardarSolicitud(createSolicSacramentoDto, comprobanteUrl);
  }

  private guardarSolicitud(
    dto: CreateSolicSacramentoDto,
    comprobanteUrl?: string,
  ) {
    const solicitud = this.solicSacraRepository.create({
      ...dto,
      Parroquia: dto.Parroquia ?? '',
      Estado: EstadoSolicitud.PENDIENTE,
      FechaSolicitud: new Date(),
      comprobanteUrl,
    });
    return this.solicSacraRepository.save(solicitud);
  }

  async findAll(filters: SearchSolicSacramentoDto = {}) {
    try {
      const query = this.solicSacraRepository.createQueryBuilder('solic');
      const nombre = filters.nombre?.trim();
      const cedula = filters.cedula?.trim();
      const estado = filters.estado;
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 10;
      const skip = (page - 1) * pageSize;

      query.select(COLUMNAS_LISTADO);

      if (nombre) {
        query.andWhere(
          `(solic."PrimerNombre" || ' ' || solic."PrimerApellido" || ' ' || COALESCE(solic."SegundoApellido", '')) ILIKE :nombre`,
          { nombre: `%${nombre}%` },
        );
      }

      if (cedula) {
        query.andWhere('CAST(solic."Cedula" AS TEXT) ILIKE :cedula', {
          cedula: `%${cedula}%`,
        });
      }

      if (estado) {
        query.andWhere('solic."Estado" = :estado', { estado });
      }

      const [result, total] = await query
        .orderBy('solic.id', 'DESC')
        .take(pageSize)
        .skip(skip)
        .getManyAndCount();

      return { data: result, total };
    } catch (error) {
      this.logger.error(
        'Error al consultar solicitudes sacramentales',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async buscar(filters: BuscarSolicSacramentoDto = {}) {
    try {
      const query = this.solicSacraRepository.createQueryBuilder('solic');

      query.select(COLUMNAS_LISTADO);

      if (filters.nombre) {
        query.andWhere(
          `(solic."PrimerNombre" || ' ' || solic."PrimerApellido" || ' ' || COALESCE(solic."SegundoApellido", '')) ILIKE :nombre`,
          { nombre: `%${filters.nombre}%` },
        );
      }

      if (filters.cedula) {
        query.andWhere('solic."Cedula" = :cedula', {
          cedula: Number(filters.cedula),
        });
      }

      if (filters.estado) {
        query.andWhere('solic."Estado" = :estado', {
          estado: ESTADOS_DE_BUSQUEDA[filters.estado],
        });
      }

      return await query.orderBy('solic.id', 'DESC').getMany();
    } catch (error) {
      this.logger.error(
        'Error al procesar la búsqueda de solicitudes sacramentales',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Error al procesar la búsqueda, intente de nuevo',
      );
    }
  }

  findOne(id: number) {
    return this.solicSacraRepository.findOneBy({ id });
  }

  async BuscarSolicPorNombre(nombre: string) {
    const solicitudes = await this.solicSacraRepository
      .createQueryBuilder('solic')
      .where('solic."PrimerNombre" ILIKE :nombre', {
        nombre: `%${nombre.trim()}%`,
      })
      .orWhere('solic."SegundoNombre" ILIKE :nombre', {
        nombre: `%${nombre.trim()}%`,
      })
      .getMany();
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el nombre ${nombre}`,
      );
    }
    return solicitudes;
  }

  async BuscarSolicPorApellido(apellido: string) {
    const solicitudes = await this.solicSacraRepository
      .createQueryBuilder('solic')
      .where(
        '(solic."PrimerApellido" ILIKE :apellido OR solic."SegundoApellido" ILIKE :apellido)',
        { apellido: `%${apellido.trim()}%` },
      )
      .getMany();
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el apellido ${apellido}`,
      );
    }
    return solicitudes;
  }

  async BuscarSolicPorCedula(cedula: number) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { Cedula: cedula },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con la cédula ${cedula}`,
      );
    }
    return solicitudes;
  }

  async BuscarPorEstado(estado: EstadoSolicitud) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { Estado: estado },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el estado ${estado}`,
      );
    }
    return solicitudes;
  }

  async CambiarEstadoSolicitud(id: number, nuevoEstado: EstadoSolicitud) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    if (isEstadoArchivado(solicitud.Estado)) {
      throw new BadRequestException(
        'La solicitud está archivada y no puede modificarse',
      );
    }

    if (
      nuevoEstado !== EstadoSolicitud.ARCHIVADA &&
      !isEstadoPendiente(solicitud.Estado)
    ) {
      throw new BadRequestException(
        'Esta solicitud ya fue procesada y no puede modificarse',
      );
    }

    solicitud.Estado = nuevoEstado;
    solicitud.FechaArchivo =
      nuevoEstado === EstadoSolicitud.ARCHIVADA ? new Date() : null;
    try {
      return await this.solicSacraRepository.save(solicitud);
    } catch (error) {
      this.logger.error(
        `Error al guardar los cambios de la solicitud sacramental con ID ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Error al guardar los cambios, intentá de nuevo',
      );
    }
  }

  async verEstadoSolicitud(id: number) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    return solicitud.Estado;
  }

  async obtenerHistorialRechazos() {
    const registros = await this.historialRechazosRepository.find({
      order: { creadoEn: 'DESC' },
      relations: {
        solicitud: true,
        usuario: true,
      },
    });

    return registros.map((registro) => ({
      id: registro.id,
      solicitud_id: registro.solicitudId,
      usuario_id: registro.usuarioId,
      motivo: registro.motivo,
      detalle: registro.detalle,
      creado_en: registro.creadoEn,
      nombre_solicitante: registro.solicitud
        ? `${registro.solicitud.PrimerNombre} ${registro.solicitud.SegundoNombre ?? ''} ${registro.solicitud.PrimerApellido ?? ''} ${registro.solicitud.SegundoApellido ?? ''}`
            .replace(/\s+/g, ' ')
            .trim()
        : null,
      nombre_usuario_rechazo: registro.usuario?.nombre ?? null,
    }));
  }

  async update(id: number, updateSolicSacramentoDto: UpdateSolicSacramentoDto) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    if (isEstadoArchivado(solicitud.Estado)) {
      throw new BadRequestException(
        'La solicitud está archivada y no puede modificarse',
      );
    }
    Object.assign(solicitud, updateSolicSacramentoDto);
    return this.solicSacraRepository.save(solicitud);
  }

  async remove(id: number) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    return this.solicSacraRepository.remove(solicitud);
  }

  async rechazarSolicitud(
    id: number,
    motivoRechazo: string,
    detalleRechazo: string | undefined,
    rechazadoPor: number,
  ) {
    const queryRunner =
      this.solicSacraRepository.manager.connection.createQueryRunner();
    // connect/startTransaction viven dentro del try: si alguno falla, el
    // finally igual suelta el queryRunner (antes se quedaba una conexión colgada)
    let transaccionIniciada = false;

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      transaccionIniciada = true;

      const solicitud = await queryRunner.manager.findOne(SolicSacramento, {
        where: { id },
      });
      if (!solicitud) {
        throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
      }

      if (!isEstadoPendiente(solicitud.Estado)) {
        throw new BadRequestException(
          `No se puede rechazar una solicitud que ya está ${solicitud.Estado}`,
        );
      }

      if (!motivoRechazo || motivoRechazo.trim() === '') {
        throw new BadRequestException(
          'El motivo de rechazo no puede estar vacío',
        );
      }

      if (detalleRechazo && detalleRechazo.length > 500) {
        throw new BadRequestException(
          'El detalle de rechazo no debe exceder 500 caracteres',
        );
      }

      solicitud.Estado = EstadoSolicitud.RECHAZADA;
      solicitud.MotivoRechazo = motivoRechazo;
      solicitud.DetalleRechazo = detalleRechazo;
      solicitud.RechazadoPor = rechazadoPor;
      solicitud.FechaRechazo = new Date();

      await queryRunner.manager.save(solicitud);

      const historial = this.historialRechazosRepository.create({
        solicitudId: solicitud.id,
        usuarioId: rechazadoPor,
        motivo: motivoRechazo,
        detalle: detalleRechazo,
        creadoEn: new Date(),
      });

      await queryRunner.manager.save(historial);

      await queryRunner.commitTransaction();

      return {
        mensaje: 'Solicitud rechazada exitosamente',
        estado: EstadoSolicitud.RECHAZADA,
      };
    } catch (error) {
      if (transaccionIniciada) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          this.logger.error(
            `No se pudo revertir la transacción del rechazo de la solicitud ${id}: ${
              rollbackError instanceof Error
                ? rollbackError.message
                : rollbackError
            }`,
          );
        }
      }
      throw error;
    } finally {
      try {
        await queryRunner.release();
      } catch (releaseError) {
        this.logger.error(
          `No se pudo liberar la conexión de la solicitud ${id}: ${
            releaseError instanceof Error ? releaseError.message : releaseError
          }`,
        );
      }
    }
  }
}
