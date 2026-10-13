import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
} from './DTO/inscripcion-cica.dto';

@Injectable()
export class CicaService {
  constructor(
    @InjectRepository(InscripcionCica)
    private readonly repositorio: Repository<InscripcionCica>,
  ) {}

  async crear(dto: CrearInscripcionCicaDto) {
    if (
      !dto.necesitaBautizo &&
      !dto.necesitaPrimeraComunion &&
      !dto.necesitaConfirmacion
    ) {
      throw new BadRequestException({
        mensaje: 'Marque al menos un sacramento que necesite.',
      });
    }

    const guardada = await this.repositorio.save(
      this.repositorio.create({
        nombre: dto.nombre,
        apellido1: dto.apellido1,
        apellido2: dto.apellido2 ?? null,
        fechaNacimiento: dto.fechaNacimiento,
        cedula: dto.cedula,
        nacionalidad: dto.nacionalidad,
        telefono: dto.telefono,
        correo: dto.correo,
        estadoCivil: dto.estadoCivil,
        conyugeNombre:
          dto.estadoCivil === 'soltero' ? null : (dto.conyugeNombre ?? null),
        conyugeApellido1:
          dto.estadoCivil === 'soltero' ? null : (dto.conyugeApellido1 ?? null),
        conyugeApellido2:
          dto.estadoCivil === 'soltero' ? null : (dto.conyugeApellido2 ?? null),
        necesitaBautizo: dto.necesitaBautizo,
        necesitaPrimeraComunion: dto.necesitaPrimeraComunion,
        necesitaConfirmacion: dto.necesitaConfirmacion,
        padreNombre: dto.padreNombre,
        padreApellido1: dto.padreApellido1,
        padreApellido2: dto.padreApellido2 ?? null,
        madreNombre: dto.madreNombre,
        madreApellido1: dto.madreApellido1,
        madreApellido2: dto.madreApellido2 ?? null,
        direccionHogar: dto.direccionHogar,
        esCatolico: dto.esCatolico,
        otraIglesia: dto.esCatolico ? null : (dto.otraIglesia ?? null),
        observacion: dto.observacion ?? null,
        estado: 'Pendiente',
      }),
    );

    return {
      id: guardada.id,
      mensaje:
        'La solicitud quedó pendiente. La parroquia la revisará y luego la aprobará o la rechazará.',
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
    dto: ActualizarEstadoCicaDto,
    revisorId?: number,
  ) {
    const inscripcion = await this.obtener(id);
    if (inscripcion.estado !== 'Pendiente') {
      throw new ConflictException({
        mensaje: `La solicitud ya fue ${inscripcion.estado.toLowerCase()} y no puede modificarse.`,
      });
    }

    inscripcion.estado = dto.estado;
    inscripcion.observacionAdministrativa =
      dto.estado === 'Rechazada'
        ? (dto.observacionAdministrativa ?? null)
        : (dto.observacionAdministrativa ?? null);
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
