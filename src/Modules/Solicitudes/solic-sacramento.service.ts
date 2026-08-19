import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { CreateSolicSacramentoDto } from './DTO/create-solic-sacramento.dto';
import { SearchSolicSacramentoDto } from './DTO/search-solic-sacramento.dto';
import { BuscarSolicSacramentoDto } from './DTO/buscar-solic-sacramento.dto';
import { UpdateSolicSacramentoDto } from './DTO/update-solic-sacramento.dto';
import { SolicSacramento } from './Entities/solic-sacramento.entity';
import { HistorialRechazos } from './Entities/historial-rechazos.entity';
import { EstadoSolicitud } from '../../Common/Enums/EstadoSolicitud';
import { TipoSacramento } from '../../Common/Enums/TipoSacramento';
import { isEstadoPendiente } from '../../Common/Utils/estado-solicitud';

@Injectable()
export class SolicSacramentoService {
  private readonly logger = new Logger(SolicSacramentoService.name);

  constructor(
    @InjectRepository(SolicSacramento)
    private readonly solicSacraRepository: Repository<SolicSacramento>,
    @InjectRepository(HistorialRechazos)
    private readonly historialRechazosRepository: Repository<HistorialRechazos>,
  ) {}

  create(createSolicSacramentoDto: CreateSolicSacramentoDto) {
    const solicitud = this.solicSacraRepository.create({
      ...createSolicSacramentoDto,
      Estado: EstadoSolicitud.PENDIENTE,
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
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      query.select([
        'solic.id',
        'solic.Nombre',
        'solic.PrimerApellido',
        'solic.SegundoApellido',
        'solic.Cedula',
        'solic.Correo',
        'solic.Telefono',
        'solic.TipoSacramento',
        'solic.Motivo',
        'solic.Estado',
      ]);

      if (nombre) {
        query.andWhere(
          `(solic."Nombre" || ' ' || solic."PrimerApellido" || ' ' || COALESCE(solic."SegundoApellido", '')) ILIKE :nombre`,
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

      query.select([
        'solic.id',
        'solic.Nombre',
        'solic.PrimerApellido',
        'solic.SegundoApellido',
        'solic.Cedula',
        'solic.Correo',
        'solic.Telefono',
        'solic.TipoSacramento',
        'solic.Motivo',
        'solic.Estado',
      ]);

      if (filters.nombre) {
        query.andWhere(
          `(solic."Nombre" || ' ' || solic."PrimerApellido" || ' ' || COALESCE(solic."SegundoApellido", '')) ILIKE :nombre`,
          { nombre: `%${filters.nombre}%` },
        );
      }

      if (filters.cedula) {
        query.andWhere('solic."Cedula" = :cedula', {
          cedula: Number(filters.cedula),
        });
      }

      if (filters.tipo) {
        query.andWhere('solic."TipoSacramento" = :tipo', {
          tipo: filters.tipo,
        });
      }

      if (filters.estado) {
        const estado =
          filters.estado === 'Aprobada'
            ? EstadoSolicitud.APROBADA
            : filters.estado === 'Rechazada'
              ? EstadoSolicitud.RECHAZADA
              : EstadoSolicitud.PENDIENTE;
        query.andWhere('solic."Estado" = :estado', { estado });
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
      .where('solic."Nombre" ILIKE :nombre', { nombre: `%${nombre.trim()}%` })
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

  async BuscarPorTipoSacramento(tipoSacramento: TipoSacramento) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { TipoSacramento: tipoSacramento },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el tipo de sacramento ${tipoSacramento}`,
      );
    }
    return solicitudes;
  }

  async CambiarEstadoSolicitud(id: number, nuevoEstado: EstadoSolicitud) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    if (!isEstadoPendiente(solicitud.Estado)) {
      throw new BadRequestException(
        'Esta solicitud ya fue procesada y no puede modificarse',
      );
    }

    solicitud.Estado = nuevoEstado;
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
        ? `${registro.solicitud.Nombre} ${registro.solicitud.PrimerApellido ?? ''} ${registro.solicitud.SegundoApellido ?? ''}`.trim()
        : null,
      nombre_usuario_rechazo: registro.usuario?.nombre ?? null,
    }));
  }

  async update(id: number, updateSolicSacramentoDto: UpdateSolicSacramentoDto) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
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
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      solicitud.Estado = 'Rechazado';
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
        estado: 'Rechazado',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
