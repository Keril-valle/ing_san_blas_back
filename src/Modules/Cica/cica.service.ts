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
import { validarUbicacionCostaRica } from '../../Common/Utils/ubicacion-costa-rica';
import type { ListarCicaDto } from './DTO/listar-cica.dto';
import { PATRON_CEDULA_CATEQUESIS } from '../../Common/DTO/identificacion-catequesis.dto';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
  requiereConyugeCica,
} from './DTO/inscripcion-cica.dto';

@Injectable()
export class CicaService {
  constructor(
    @InjectRepository(InscripcionCica)
    private readonly repositorio: Repository<InscripcionCica>,
  ) {}

  // Valida la ubicación y guarda sin permitir otra solicitud pendiente de la misma cédula.
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

    validarUbicacionCostaRica(dto);
    const conyuge = requiereConyugeCica(dto.estadoCivil);

    const guardada = await guardarMatricula(
      this.repositorio,
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
        conyugeNombre: conyuge ? (dto.conyugeNombre ?? null) : null,
        conyugeApellido1: conyuge ? (dto.conyugeApellido1 ?? null) : null,
        conyugeApellido2: conyuge ? (dto.conyugeApellido2 ?? null) : null,
        necesitaBautizo: dto.necesitaBautizo,
        necesitaPrimeraComunion: dto.necesitaPrimeraComunion,
        necesitaConfirmacion: dto.necesitaConfirmacion,
        padreNombre: dto.padreNombre,
        padreApellido1: dto.padreApellido1,
        padreApellido2: dto.padreApellido2 ?? null,
        madreNombre: dto.madreNombre,
        madreApellido1: dto.madreApellido1,
        madreApellido2: dto.madreApellido2 ?? null,
        provincia: dto.provincia,
        canton: dto.canton,
        distrito: dto.distrito,
        direccionHogar: dto.direccionHogar,
        esCatolico: dto.esCatolico,
        otraIglesia: dto.esCatolico ? null : (dto.otraIglesia ?? null),
        observacion: dto.observacion ?? null,
        estado: 'Pendiente',
      }),
      'UQ_cica_cedula_pendiente',
    );

    return {
      id: guardada.id,
      mensaje:
        'La solicitud quedó pendiente. La parroquia la revisará y luego la aprobará o la rechazará.',
      estado: guardada.estado,
    };
  }

  // Filtra en servidor; los nombres de columna salen de este catálogo, no del usuario.
  listar(filtros: ListarCicaDto) {
    const columnas = {
      bautizo: 'necesitaBautizo',
      primeraComunion: 'necesitaPrimeraComunion',
      confirmacion: 'necesitaConfirmacion',
    };
    return listarMatriculas(
      this.repositorio,
      filtros,
      ['nombre', 'apellido1', 'apellido2', 'cedula', 'telefono', 'correo'],
      filtros.sacramento
        ? { columna: columnas[filtros.sacramento], valor: true }
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
