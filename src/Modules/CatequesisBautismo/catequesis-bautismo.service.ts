import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesisBautismo } from './Entities/inscripcion-catequesis-bautismo.entity';
import {
  ActualizarEstadoCatequesisBautismoDto,
  CrearInscripcionCatequesisBautismoDto,
} from './DTO/inscripcion-catequesis-bautismo.dto';

@Injectable()
export class CatequesisBautismoService {
  constructor(
    @InjectRepository(InscripcionCatequesisBautismo)
    private readonly repositorio: Repository<InscripcionCatequesisBautismo>,
  ) {}

  async crear(dto: CrearInscripcionCatequesisBautismoDto) {
    const guardada = await this.repositorio.save(
      this.repositorio.create({
        nombre: dto.nombre,
        apellido1: dto.apellido1,
        apellido2: dto.apellido2 ?? null,
        fechaNacimiento: dto.fechaNacimiento,
        cedula: dto.cedula,
        telefono: dto.telefono,
        estadoCivil: dto.estadoCivil,
        parroquiaOrigen: dto.parroquiaOrigen,
        provincia: dto.provincia,
        canton: dto.canton,
        distrito: dto.distrito,
        barrio: dto.barrio,
        condicion: dto.condicion,
        estado: 'Pendiente',
      }),
    );

    return {
      id: guardada.id,
      mensaje:
        'La solicitud quedó pendiente. Cuando termine la catequesis, la parroquia certificará que ya puede seguir con el bautismo.',
      estado: guardada.estado,
    };
  }

  listar(vista: 'solicitudes' | 'historial', estado?: string) {
    const consulta = this.repositorio
      .createQueryBuilder('inscripcion')
      .orderBy('inscripcion.fechaSolicitud', 'DESC');

    if (vista === 'historial') {
      consulta.where('inscripcion.estado IN (:...finales)', {
        finales: ['Aprobada', 'Rechazada'],
      });
      if (estado === 'Aprobada' || estado === 'Rechazada') {
        consulta.andWhere('inscripcion.estado = :estado', { estado });
      }
    } else {
      consulta.where('inscripcion.estado = :estado', { estado: 'Pendiente' });
    }

    return consulta.getMany();
  }

  async obtener(id: number) {
    const inscripcion = await this.repositorio.findOneBy({ id });
    if (!inscripcion) {
      throw new NotFoundException({ mensaje: 'La solicitud no existe.' });
    }
    return inscripcion;
  }

  async actualizarEstado(
    id: number,
    dto: ActualizarEstadoCatequesisBautismoDto,
    revisorId?: number,
  ) {
    const inscripcion = await this.obtener(id);
    if (inscripcion.estado !== 'Pendiente') {
      throw new ConflictException({
        mensaje: `La solicitud ya fue ${inscripcion.estado.toLowerCase()} y no puede modificarse.`,
      });
    }

    if (
      dto.estado === 'Aprobada' &&
      dto.fechaInicioCatequesis &&
      dto.fechaFinalizacionCatequesis &&
      dto.fechaFinalizacionCatequesis < dto.fechaInicioCatequesis
    ) {
      throw new BadRequestException({
        mensaje: 'La finalización debe ser igual o posterior al inicio.',
      });
    }

    inscripcion.estado = dto.estado;
    inscripcion.observacionAdministrativa =
      dto.estado === 'Rechazada'
        ? (dto.observacionAdministrativa ?? null)
        : null;
    inscripcion.fechaInicioCatequesis =
      dto.estado === 'Aprobada' ? (dto.fechaInicioCatequesis ?? null) : null;
    inscripcion.fechaFinalizacionCatequesis =
      dto.estado === 'Aprobada'
        ? (dto.fechaFinalizacionCatequesis ?? null)
        : null;
    inscripcion.responsableCertifica =
      dto.estado === 'Aprobada' ? (dto.responsableCertifica ?? null) : null;
    inscripcion.fechaActualizacionEstado = new Date();
    inscripcion.revisadoPor = revisorId ?? null;
    return this.repositorio.save(inscripcion);
  }

  consultarPorCedula(cedula: string) {
    const limpia = cedula?.trim() ?? '';
    if (!/^\d{9}$/.test(limpia)) {
      throw new BadRequestException({
        mensaje: 'La cédula debe tener 9 dígitos.',
      });
    }

    return this.repositorio.find({
      where: { cedula: limpia },
      order: { fechaSolicitud: 'DESC' },
      select: {
        id: true,
        nombre: true,
        apellido1: true,
        apellido2: true,
        estado: true,
        fechaSolicitud: true,
        fechaActualizacionEstado: true,
      },
    });
  }
}
