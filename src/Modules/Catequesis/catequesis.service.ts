import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesis } from './Entities/inscripcion-catequesis.entity';
import { CrearInscripcionCatequesisDto } from './DTO/crear-inscripcion-catequesis.dto';
import {
  ActualizarEstadoResponseDto,
  CrearInscripcionResponseDto,
  InscripcionDetalleDto,
  InscripcionResumenDto,
} from './DTO/inscripcion-response.dto';
import {
  MENSAJE_FECHA_BAUTISMO_FUTURA,
  MENSAJE_FECHA_NACIMIENTO_FUTURA,
  MENSAJE_NIVEL_INVALIDO,
  normalizarEstadoInscripcion,
  normalizarNivelInscripcion,
  validarFechaNoFutura,
} from '../../Common/Utils/inscripcion-catequesis-validaciones';

@Injectable()
export class CatequesisService {
  constructor(
    @InjectRepository(InscripcionCatequesis)
    private readonly inscripcionRepository: Repository<InscripcionCatequesis>,
  ) {}

  async create(
    dto: CrearInscripcionCatequesisDto,
  ): Promise<CrearInscripcionResponseDto> {
    this.validarReglasNegocio(dto);

    const nivel = normalizarNivelInscripcion(dto.datosInscripcion.nivelAInscribirse);
    if (!nivel) {
      throw new BadRequestException({ mensaje: MENSAJE_NIVEL_INVALIDO });
    }

    const inscripcion = this.inscripcionRepository.create({
      centroCatequesis: dto.datosInscripcion.centroCatequesis.trim(),
      nivelAInscribirse: nivel,
      estado: 'Pendiente',
      fechaSolicitud: new Date(),
      feBautismoArchivo: dto.datosInscripcion.feBautismoArchivo.trim(),
      catequizando: {
        nombre: dto.datosCatequizando.nombre.trim(),
        apellidos: dto.datosCatequizando.apellidos.trim(),
        fechaNacimiento: dto.datosCatequizando.fechaNacimiento.trim(),
        direccionExacta: dto.datosCatequizando.direccionExacta.trim(),
      },
      bautismo: {
        parroquia: dto.datosBautismo.parroquia.trim(),
        fecha: dto.datosBautismo.fecha?.trim() || null,
        tomo: dto.datosBautismo.tomo?.trim() || null,
        folio: dto.datosBautismo.folio?.trim() || null,
        asiento: dto.datosBautismo.asiento?.trim() || null,
      },
      adecuacion: {
        requiereAdecuacionCentroEducativo:
          dto.datosAdecuacion.requiereAdecuacionCentroEducativo,
        descripcionAdecuacion:
          dto.datosAdecuacion.descripcionAdecuacion?.trim() || null,
      },
      condicionSalud: {
        portadorEnfermedadCronica:
          dto.datosCondicionSalud.portadorEnfermedadCronica,
        descripcionEnfermedad:
          dto.datosCondicionSalud.descripcionEnfermedad?.trim() || null,
      },
      madre: {
        nombre: dto.datosMadre.nombre.trim(),
        apellidos: dto.datosMadre.apellidos.trim(),
        direccionExacta: dto.datosMadre.direccionExacta.trim(),
        ciudad: dto.datosMadre.ciudad.trim(),
        provincia: dto.datosMadre.provincia.trim(),
        telefono: dto.datosMadre.telefono.trim(),
      },
      personaInscribe: {
        nombre: dto.datosPersonaInscribe.nombre.trim(),
        apellidos: dto.datosPersonaInscribe.apellidos.trim(),
        parentesco: dto.datosPersonaInscribe.parentesco.trim(),
      },
      pago: {
        metodoPago: dto.datosPago.metodoPago.trim(),
        numeroComprobanteSinpe: dto.datosPago.numeroComprobanteSinpe.trim(),
        comprobanteArchivo: dto.datosPago.comprobanteArchivo.trim(),
        monto: dto.datosPago.monto,
      },
    });

    const saved = await this.inscripcionRepository.save(inscripcion);

    return {
      id: saved.id,
      mensaje: 'Inscripción a catequesis registrada correctamente',
      estado: saved.estado,
      fechaSolicitud: saved.fechaSolicitud,
    };
  }

  async findAll(estado?: string | null): Promise<InscripcionResumenDto[]> {
    const query = this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.catequizando', 'catequizando')
      .leftJoinAndSelect('inscripcion.madre', 'madre')
      .orderBy('inscripcion.fechaSolicitud', 'DESC');

    if (estado) {
      query.andWhere('inscripcion.estado = :estado', { estado });
    }

    const inscripciones = await query.getMany();
    return inscripciones.map((inscripcion) => this.toResumenDto(inscripcion));
  }

  async findById(id: number): Promise<InscripcionDetalleDto | null> {
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id },
      relations: {
        catequizando: true,
        bautismo: true,
        adecuacion: true,
        condicionSalud: true,
        madre: true,
        pago: true,
        personaInscribe: true,
      },
    });

    return inscripcion ? this.toDetalleDto(inscripcion) : null;
  }

  async findForExport(estado: string): Promise<
    Array<{
      nombre: string;
      apellidos: string;
      fechaNacimiento: string;
      centroCatequesis: string;
      nivelAInscribirse: string;
      estado: string;
      fechaSolicitud: Date;
    }>
  > {
    const inscripciones = await this.inscripcionRepository.find({
      where: { estado },
      relations: { catequizando: true },
      order: { fechaSolicitud: 'DESC' },
    });

    return inscripciones.map((inscripcion) => ({
      nombre: inscripcion.catequizando?.nombre ?? '',
      apellidos: inscripcion.catequizando?.apellidos ?? '',
      fechaNacimiento: inscripcion.catequizando?.fechaNacimiento ?? '',
      centroCatequesis: inscripcion.centroCatequesis,
      nivelAInscribirse: inscripcion.nivelAInscribirse,
      estado: inscripcion.estado,
      fechaSolicitud: inscripcion.fechaSolicitud,
    }));
  }

  async updateEstado(
    id: number,
    estado: string,
    observacion?: string | null,
  ): Promise<ActualizarEstadoResponseDto | null> {
    const inscripcion = await this.inscripcionRepository.findOne({ where: { id } });
    if (!inscripcion) {
      return null;
    }

    const estadoNormalizado = normalizarEstadoInscripcion(estado);
    if (!estadoNormalizado) {
      throw new BadRequestException({
        mensaje: 'El estado solo puede ser Pendiente, Aprobada o Rechazada.',
      });
    }

    inscripcion.estado = estadoNormalizado;
    inscripcion.observacionAdministrativa = observacion?.trim() || null;
    inscripcion.fechaActualizacionEstado = new Date();

    const saved = await this.inscripcionRepository.save(inscripcion);

    return {
      id: saved.id,
      mensaje: 'Estado de inscripción actualizado correctamente',
      estado: saved.estado,
      observacionAdministrativa: saved.observacionAdministrativa,
      fechaActualizacionEstado: saved.fechaActualizacionEstado!,
    };
  }

  private validarReglasNegocio(dto: CrearInscripcionCatequesisDto): void {
    if (!validarFechaNoFutura(dto.datosCatequizando.fechaNacimiento)) {
      throw new BadRequestException({ mensaje: MENSAJE_FECHA_NACIMIENTO_FUTURA });
    }

    if (!validarFechaNoFutura(dto.datosBautismo.fecha)) {
      throw new BadRequestException({ mensaje: MENSAJE_FECHA_BAUTISMO_FUTURA });
    }
  }

  private toResumenDto(inscripcion: InscripcionCatequesis): InscripcionResumenDto {
    const nombre = inscripcion.catequizando?.nombre ?? '';
    const apellidos = inscripcion.catequizando?.apellidos ?? '';

    return {
      id: inscripcion.id,
      nombreCatequizando: `${nombre} ${apellidos}`.trim(),
      centroCatequesis: inscripcion.centroCatequesis,
      nivelAInscribirse: inscripcion.nivelAInscribirse,
      estado: inscripcion.estado,
      fechaSolicitud: inscripcion.fechaSolicitud,
      telefonoEncargada: inscripcion.madre?.telefono ?? '',
    };
  }

  private toDetalleDto(inscripcion: InscripcionCatequesis): InscripcionDetalleDto {
    return {
      id: inscripcion.id,
      centroCatequesis: inscripcion.centroCatequesis,
      nivelAInscribirse: inscripcion.nivelAInscribirse,
      estado: inscripcion.estado,
      fechaSolicitud: inscripcion.fechaSolicitud,
      feBautismoArchivo: inscripcion.feBautismoArchivo,
      observacionAdministrativa: inscripcion.observacionAdministrativa,
      catequizando: {
        nombre: inscripcion.catequizando?.nombre ?? '',
        apellidos: inscripcion.catequizando?.apellidos ?? '',
        fechaNacimiento: inscripcion.catequizando?.fechaNacimiento ?? '',
        direccionExacta: inscripcion.catequizando?.direccionExacta ?? '',
      },
      bautismo: {
        parroquia: inscripcion.bautismo?.parroquia ?? '',
        fecha: inscripcion.bautismo?.fecha ?? null,
        tomo: inscripcion.bautismo?.tomo ?? '',
        folio: inscripcion.bautismo?.folio ?? '',
        asiento: inscripcion.bautismo?.asiento ?? '',
      },
      adecuacion: {
        requiereAdecuacionCentroEducativo:
          inscripcion.adecuacion?.requiereAdecuacionCentroEducativo ?? null,
        descripcionAdecuacion: inscripcion.adecuacion?.descripcionAdecuacion ?? '',
      },
      condicionSalud: {
        portadorEnfermedadCronica:
          inscripcion.condicionSalud?.portadorEnfermedadCronica ?? null,
        descripcionEnfermedad:
          inscripcion.condicionSalud?.descripcionEnfermedad ?? '',
      },
      madre: {
        nombre: inscripcion.madre?.nombre ?? '',
        apellidos: inscripcion.madre?.apellidos ?? '',
        direccionExacta: inscripcion.madre?.direccionExacta ?? '',
        ciudad: inscripcion.madre?.ciudad ?? '',
        provincia: inscripcion.madre?.provincia ?? '',
        telefono: inscripcion.madre?.telefono ?? '',
      },
      personaInscribe: {
        nombre: inscripcion.personaInscribe?.nombre ?? '',
        apellidos: inscripcion.personaInscribe?.apellidos ?? '',
        parentesco: inscripcion.personaInscribe?.parentesco ?? '',
      },
      pago: {
        metodoPago: inscripcion.pago?.metodoPago ?? '',
        numeroComprobanteSinpe: inscripcion.pago?.numeroComprobanteSinpe ?? '',
        comprobanteArchivo: inscripcion.pago?.comprobanteArchivo ?? '',
        monto: Number(inscripcion.pago?.monto ?? 0),
      },
    };
  }
}
