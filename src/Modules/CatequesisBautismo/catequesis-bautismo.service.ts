import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { guardarMatricula } from '../../Common/Utils/guardar-matricula';
import { listarMatriculas } from '../../Common/Utils/listar-matriculas';
import type { ListarBautismoDto } from './DTO/listar-bautismo.dto';
import { PATRON_CEDULA_CATEQUESIS } from '../../Common/DTO/identificacion-catequesis.dto';
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

  // Inscribe al interesado; las fechas y el responsable siguen quedando para la certificación del admin.
  async crear(dto: CrearInscripcionCatequesisBautismoDto) {
    const guardada = await guardarMatricula(
      this.repositorio,
      this.repositorio.create({
        nombre: dto.nombre,
        apellido1: dto.apellido1,
        apellido2: dto.apellido2 ?? null,
        fechaNacimiento: dto.fechaNacimiento,
        cedula: dto.cedula,
        nacionalidad: dto.nacionalidad ?? null,
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
      'UQ_bautismo_cedula_pendiente',
    );

    return {
      id: guardada.id,
      mensaje:
        'La solicitud quedó pendiente. Cuando termine la catequesis, la parroquia certificará que ya puede seguir con el bautismo.',
      estado: guardada.estado,
    };
  }

  // Mantiene el flujo de certificación y pagina solo la consulta del panel.
  listar(filtros: ListarBautismoDto) {
    return listarMatriculas(
      this.repositorio,
      filtros,
      [
        'nombre',
        'apellido1',
        'apellido2',
        'cedula',
        'telefono',
        'parroquiaOrigen',
      ],
      filtros.condicion
        ? { columna: 'condicion', valor: filtros.condicion }
        : undefined,
    );
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

  async remove(id: number) {
    const inscripcion = await this.repositorio.findOneBy({ id });
    if (!inscripcion) {
      throw new NotFoundException({ mensaje: 'La solicitud no existe.' });
    }
    if (
      inscripcion.estado !== 'Aprobada' &&
      inscripcion.estado !== 'Rechazada'
    ) {
      throw new BadRequestException({
        mensaje: 'Solo se pueden eliminar solicitudes aprobadas o rechazadas.',
      });
    }
    await this.repositorio.remove(inscripcion);
  }

  consultarPorCedula(cedula: string) {
    const limpia = cedula?.trim() ?? '';
    if (!PATRON_CEDULA_CATEQUESIS.test(limpia)) {
      throw new BadRequestException({
        mensaje: 'La cédula debe tener 9 dígitos (nacional) o 12 (extranjera).',
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
