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
import { HistorialInscripcionCatequesisDto } from './DTO/historial-inscripcion-response.dto';
import {
  MENSAJE_FECHA_BAUTISMO_FUTURA,
  MENSAJE_FECHA_NACIMIENTO_FUTURA,
  MENSAJE_NIVEL_INVALIDO,
  normalizarEstadoInscripcion,
  normalizarNivelInscripcion,
  unirApellidos,
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

    const nivel = normalizarNivelInscripcion(
      dto.datosInscripcion.nivelAInscribirse,
    );
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
        primerApellido: dto.datosCatequizando.primerApellido.trim(),
        segundoApellido:
          dto.datosCatequizando.segundoApellido?.trim() || null,
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
      ...(dto.datosMadre
        ? {
            madre: {
              nombre: dto.datosMadre.nombre.trim(),
              primerApellido: dto.datosMadre.primerApellido.trim(),
              segundoApellido: dto.datosMadre.segundoApellido?.trim() || null,
              direccionExacta: dto.datosMadre.direccionExacta.trim(),
              ciudad: dto.datosMadre.ciudad.trim(),
              provincia: dto.datosMadre.provincia.trim(),
              telefono: dto.datosMadre.telefono.trim(),
            },
          }
        : {}),
      personaInscribe: {
        nombre: dto.datosPersonaInscribe.nombre.trim(),
        primerApellido: dto.datosPersonaInscribe.primerApellido.trim(),
        segundoApellido:
          dto.datosPersonaInscribe.segundoApellido?.trim() || null,
        parentesco: dto.datosPersonaInscribe.parentesco.trim(),
        correo: dto.datosPersonaInscribe.correo?.trim() || null,
        telefono: dto.datosPersonaInscribe.telefono.trim(),
      },
      pago: {
        metodoPago: dto.datosPago.metodoPago.trim(),
        numeroComprobanteSinpe: dto.datosPago.numeroComprobanteSinpe.trim(),
        comprobanteArchivo: dto.datosPago.comprobanteArchivo.trim(),
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

  async findAll(opciones: {
    estado?: string | null;
    nombre?: string;
    encargado?: string;
    q?: string;
  }): Promise<InscripcionResumenDto[]> {
    const query = this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.catequizando', 'catequizando')
      .leftJoinAndSelect('inscripcion.madre', 'madre')
      .leftJoinAndSelect('inscripcion.personaInscribe', 'personaInscribe')
      .orderBy('inscripcion.fechaSolicitud', 'DESC');

    if (opciones.estado) {
      query.andWhere('inscripcion.estado = :estado', {
        estado: opciones.estado,
      });
    } else {
      query.andWhere('inscripcion.estado NOT IN (:...estadosFinales)', {
        estadosFinales: ['Aprobada', 'Rechazada'],
      });
    }

    if (opciones.nombre) {
      const nombre = `%${opciones.nombre.toLowerCase()}%`;
      query.andWhere(
        `LOWER(CONCAT(COALESCE(catequizando.nombre, ''), ' ', COALESCE(catequizando.primerApellido, ''), ' ', COALESCE(catequizando.segundoApellido, ''))) LIKE :nombre`,
        { nombre },
      );
    }

    if (opciones.encargado) {
      const encargado = `%${opciones.encargado.toLowerCase()}%`;
      query.andWhere(
        `(LOWER(CONCAT(COALESCE(personaInscribe.nombre, ''), ' ', COALESCE(personaInscribe.primerApellido, ''), ' ', COALESCE(personaInscribe.segundoApellido, ''))) LIKE :encargado
          OR LOWER(CONCAT(COALESCE(madre.nombre, ''), ' ', COALESCE(madre.primerApellido, ''), ' ', COALESCE(madre.segundoApellido, ''))) LIKE :encargado)`,
        { encargado },
      );
    }

    if (opciones.q) {
      const q = `%${opciones.q.toLowerCase()}%`;
      query.andWhere(
        `(LOWER(CONCAT(COALESCE(catequizando.nombre, ''), ' ', COALESCE(catequizando.primerApellido, ''), ' ', COALESCE(catequizando.segundoApellido, ''))) LIKE :q
          OR LOWER(COALESCE(madre.telefono, '')) LIKE :q
          OR LOWER(COALESCE(personaInscribe.telefono, '')) LIKE :q
          OR LOWER(CONCAT(COALESCE(personaInscribe.nombre, ''), ' ', COALESCE(personaInscribe.primerApellido, ''), ' ', COALESCE(personaInscribe.segundoApellido, ''))) LIKE :q
          OR LOWER(CONCAT(COALESCE(madre.nombre, ''), ' ', COALESCE(madre.primerApellido, ''), ' ', COALESCE(madre.segundoApellido, ''))) LIKE :q)`,
        { q },
      );
    }

    const inscripciones = await query.getMany();
    return inscripciones.map((inscripcion) => this.toResumenDto(inscripcion));
  }

  async historial(opciones: {
    estado?: string;
    desde?: string;
    hasta?: string;
  }): Promise<{
    total: number;
    historial: HistorialInscripcionCatequesisDto[];
  }> {
    const qb = this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.catequizando', 'catequizando')
      .leftJoinAndSelect('inscripcion.madre', 'madre')
      .leftJoinAndSelect('inscripcion.personaInscribe', 'personaInscribe')
      .where('inscripcion.estado IN (:...estadosFinales)', {
        estadosFinales: ['Aprobada', 'Rechazada'],
      });

    if (opciones.estado) {
      const estadoNorm =
        opciones.estado.toLowerCase() === 'aprobado' ||
        opciones.estado.toLowerCase() === 'aprobada'
          ? 'Aprobada'
          : 'Rechazada';
      qb.andWhere('inscripcion.estado = :estado', { estado: estadoNorm });
    }

    if (opciones.desde) {
      qb.andWhere('inscripcion.fechaSolicitud >= :desde', {
        desde: new Date(`${opciones.desde}T00:00:00`),
      });
    }

    if (opciones.hasta) {
      const hasta = new Date(`${opciones.hasta}T00:00:00`);
      hasta.setDate(hasta.getDate() + 1);
      qb.andWhere('inscripcion.fechaSolicitud < :hasta', { hasta });
    }

    qb.orderBy('inscripcion.fechaSolicitud', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    return {
      total,
      historial: items.map((inscripcion) => {
        const nombre = inscripcion.catequizando?.nombre ?? '';
        const apellidos = unirApellidos(
          inscripcion.catequizando?.primerApellido,
          inscripcion.catequizando?.segundoApellido,
        );

        return {
          id: inscripcion.id,
          nombreCatequizando: `${nombre} ${apellidos}`.trim(),
          centroCatequesis: inscripcion.centroCatequesis,
          nivelAInscribirse: inscripcion.nivelAInscribirse,
          estado: inscripcion.estado,
          fechaSolicitud: inscripcion.fechaSolicitud,
      telefonoEncargada:
        inscripcion.personaInscribe?.telefono ??
        inscripcion.madre?.telefono ??
        '',
          observacionAdministrativa: inscripcion.observacionAdministrativa,
          fechaActualizacionEstado: inscripcion.fechaActualizacionEstado,
        };
      }),
    };
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
      primerApellido: string;
      segundoApellido: string;
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
      primerApellido: inscripcion.catequizando?.primerApellido ?? '',
      segundoApellido: inscripcion.catequizando?.segundoApellido ?? '',
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
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id },
    });
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
      throw new BadRequestException({
        mensaje: MENSAJE_FECHA_NACIMIENTO_FUTURA,
      });
    }

    if (!validarFechaNoFutura(dto.datosBautismo.fecha)) {
      throw new BadRequestException({ mensaje: MENSAJE_FECHA_BAUTISMO_FUTURA });
    }
  }

  private toResumenDto(
    inscripcion: InscripcionCatequesis,
  ): InscripcionResumenDto {
    const nombre = inscripcion.catequizando?.nombre ?? '';
    const apellidos = unirApellidos(
      inscripcion.catequizando?.primerApellido,
      inscripcion.catequizando?.segundoApellido,
    );

    const nombreEncargado =
      `${inscripcion.personaInscribe?.nombre ?? ''} ${unirApellidos(inscripcion.personaInscribe?.primerApellido, inscripcion.personaInscribe?.segundoApellido)}`.trim() ||
      `${inscripcion.madre?.nombre ?? ''} ${unirApellidos(inscripcion.madre?.primerApellido, inscripcion.madre?.segundoApellido)}`.trim();

    return {
      id: inscripcion.id,
      nombreCatequizando: `${nombre} ${apellidos}`.trim(),
      centroCatequesis: inscripcion.centroCatequesis,
      nivelAInscribirse: inscripcion.nivelAInscribirse,
      estado: inscripcion.estado,
      fechaSolicitud: inscripcion.fechaSolicitud,
      telefonoEncargada:
        inscripcion.personaInscribe?.telefono ??
        inscripcion.madre?.telefono ??
        '',
      nombreEncargado,
      correoEncargado: inscripcion.personaInscribe?.correo ?? '',
    };
  }

  private toDetalleDto(
    inscripcion: InscripcionCatequesis,
  ): InscripcionDetalleDto {
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
        primerApellido: inscripcion.catequizando?.primerApellido ?? '',
        segundoApellido: inscripcion.catequizando?.segundoApellido ?? '',
        apellidos: unirApellidos(
          inscripcion.catequizando?.primerApellido,
          inscripcion.catequizando?.segundoApellido,
        ),
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
        descripcionAdecuacion:
          inscripcion.adecuacion?.descripcionAdecuacion ?? '',
      },
      condicionSalud: {
        portadorEnfermedadCronica:
          inscripcion.condicionSalud?.portadorEnfermedadCronica ?? null,
        descripcionEnfermedad:
          inscripcion.condicionSalud?.descripcionEnfermedad ?? '',
      },
      madre: {
        nombre: inscripcion.madre?.nombre ?? '',
        primerApellido: inscripcion.madre?.primerApellido ?? '',
        segundoApellido: inscripcion.madre?.segundoApellido ?? '',
        apellidos: unirApellidos(
          inscripcion.madre?.primerApellido,
          inscripcion.madre?.segundoApellido,
        ),
        direccionExacta: inscripcion.madre?.direccionExacta ?? '',
        ciudad: inscripcion.madre?.ciudad ?? '',
        provincia: inscripcion.madre?.provincia ?? '',
        telefono: inscripcion.madre?.telefono ?? '',
      },
      personaInscribe: {
        nombre: inscripcion.personaInscribe?.nombre ?? '',
        primerApellido: inscripcion.personaInscribe?.primerApellido ?? '',
        segundoApellido: inscripcion.personaInscribe?.segundoApellido ?? '',
        apellidos: unirApellidos(
          inscripcion.personaInscribe?.primerApellido,
          inscripcion.personaInscribe?.segundoApellido,
        ),
        parentesco: inscripcion.personaInscribe?.parentesco ?? '',
        correo: inscripcion.personaInscribe?.correo ?? '',
        telefono: inscripcion.personaInscribe?.telefono ?? '',
      },
      pago: {
        metodoPago: inscripcion.pago?.metodoPago ?? '',
        numeroComprobanteSinpe: inscripcion.pago?.numeroComprobanteSinpe ?? '',
        comprobanteArchivo: inscripcion.pago?.comprobanteArchivo ?? '',
      },
    };
  }
}
