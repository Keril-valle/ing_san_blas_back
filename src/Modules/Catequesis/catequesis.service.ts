import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InscripcionCatequesis } from './Entities/inscripcion-catequesis.entity';
import { Usuario } from '../../Users/Entities/usuario.entity';
import { CrearInscripcionCatequesisDto } from './DTO/crear-inscripcion-catequesis.dto';
import {
  ActualizarEstadoResponseDto,
  CrearInscripcionResponseDto,
  InscripcionDetalleDto,
  InscripcionResumenDto,
} from './DTO/inscripcion-response.dto';
import { HistorialInscripcionCatequesisDto } from './DTO/historial-inscripcion-response.dto';
import {
  MENSAJE_ESTADO_INVALIDO,
  MENSAJE_FECHA_NACIMIENTO_FUTURA,
  MENSAJE_NIVEL_INVALIDO,
  normalizarEstadoInscripcion,
  normalizarNivelInscripcion,
  unirApellidos,
  validarFechaNoFutura,
} from '../../Common/Utils/inscripcion-catequesis-validaciones';
import {
  CatequesisMailService,
  type AvisoInscripcionCatequesis,
} from '../../Notifications/Services/catequesis-mail.service';

const unirNombreEncargado = (inscripcion: InscripcionCatequesis): string => {
  const personaInscribe = `${inscripcion.personaInscribe?.nombre ?? ''} ${unirApellidos(
    inscripcion.personaInscribe?.primerApellido,
    inscripcion.personaInscribe?.segundoApellido,
  )}`.trim();

  if (personaInscribe) return personaInscribe;

  return `${inscripcion.madre?.nombre ?? ''} ${unirApellidos(
    inscripcion.madre?.primerApellido,
    inscripcion.madre?.segundoApellido,
  )}`.trim();
};

@Injectable()
export class CatequesisService {
  private readonly logger = new Logger(CatequesisService.name);

  constructor(
    @InjectRepository(InscripcionCatequesis)
    private readonly inscripcionRepository: Repository<InscripcionCatequesis>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Optional() private readonly catequesisMail?: CatequesisMailService,
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
        segundoApellido: dto.datosCatequizando.segundoApellido?.trim() || null,
        fechaNacimiento: dto.datosCatequizando.fechaNacimiento.trim(),
        direccionExacta: dto.datosCatequizando.direccionExacta.trim(),
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
    nivel?: string;
    filial?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: InscripcionResumenDto[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
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

    if (opciones.nivel) {
      query.andWhere(
        'LOWER(inscripcion.nivelAInscribirse) = LOWER(:nivel)',
        { nivel: opciones.nivel },
      );
    }

    if (opciones.filial) {
      query.andWhere(
        'LOWER(inscripcion.centroCatequesis) = LOWER(:filial)',
        { filial: opciones.filial },
      );
    }

    const pagina = Math.max(1, Math.floor(opciones.page ?? 1) || 1);
    const limite = Math.min(
      100,
      Math.max(1, Math.floor(opciones.limit ?? 10) || 10),
    );

    const [inscripciones, total] = await query
      .take(limite)
      .skip((pagina - 1) * limite)
      .getManyAndCount();

    return {
      data: inscripciones.map((inscripcion) => this.toResumenDto(inscripcion)),
      total,
      page: pagina,
      pages: Math.ceil(total / limite),
      limit: limite,
    };
  }

  async historial(opciones: {
    estado?: string;
    desde?: string;
    hasta?: string;
    encargado?: string;
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

    if (opciones.encargado) {
      const encargado = `%${opciones.encargado.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(CONCAT(COALESCE(personaInscribe.nombre, ''), ' ', COALESCE(personaInscribe.primerApellido, ''), ' ', COALESCE(personaInscribe.segundoApellido, ''))) LIKE :encargado
          OR LOWER(CONCAT(COALESCE(madre.nombre, ''), ' ', COALESCE(madre.primerApellido, ''), ' ', COALESCE(madre.segundoApellido, ''))) LIKE :encargado)`,
        { encargado },
      );
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

    qb.orderBy('inscripcion.fechaActualizacionEstado', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    const revisorIds = [
      ...new Set(
        items
          .map((inscripcion) => inscripcion.revisadoPor)
          .filter((id): id is number => id != null),
      ),
    ];

    const revisores = new Map<number, string>();
    if (revisorIds.length > 0) {
      const usuarios = await this.usuarioRepository.find({
        where: { id: In(revisorIds) },
      });
      for (const usuario of usuarios) {
        revisores.set(usuario.id, usuario.nombre?.trim() || usuario.email);
      }
    }

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
          nombreEncargado: unirNombreEncargado(inscripcion),
          observacionAdministrativa: inscripcion.observacionAdministrativa,
          fechaActualizacionEstado: inscripcion.fechaActualizacionEstado,
          revisor:
            inscripcion.revisadoPor != null
              ? (revisores.get(inscripcion.revisadoPor) ?? null)
              : null,
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

  async findForExport(filtros: {
    estado?: string;
    nivel?: string;
    filial?: string;
  } = {}): Promise<
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
    const query = this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.catequizando', 'catequizando')
      .orderBy('inscripcion.fechaSolicitud', 'DESC');

    if (filtros.estado) {
      query.andWhere('inscripcion.estado = :estado', {
        estado: filtros.estado,
      });
    }

    if (filtros.nivel) {
      query.andWhere(
        'LOWER(inscripcion.nivelAInscribirse) = LOWER(:nivel)',
        { nivel: filtros.nivel },
      );
    }

    if (filtros.filial) {
      query.andWhere(
        'LOWER(inscripcion.centroCatequesis) = LOWER(:filial)',
        { filial: filtros.filial },
      );
    }

    const inscripciones = await query.getMany();

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

  async findByCorreoSolicitante(
    correo: string,
  ): Promise<InscripcionResumenDto[]> {
    const inscripciones = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.catequizando', 'catequizando')
      .leftJoinAndSelect('inscripcion.personaInscribe', 'personaInscribe')
      .leftJoinAndSelect('inscripcion.madre', 'madre')
      .where('LOWER(personaInscribe.correo) = LOWER(:correo)', {
        correo: correo.trim(),
      })
      .orderBy('inscripcion.fechaSolicitud', 'DESC')
      .getMany();

    return inscripciones.map((inscripcion) => this.toResumenDto(inscripcion));
  }

  async updateEstado(
    id: number,
    estado: string,
    observacion?: string | null,
    revisorId?: number,
  ): Promise<ActualizarEstadoResponseDto | null> {
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id },
      relations: { catequizando: true, personaInscribe: true },
    });
    if (!inscripcion) {
      return null;
    }

    const estadoNormalizado = normalizarEstadoInscripcion(estado);
    if (!estadoNormalizado) {
      throw new BadRequestException({ mensaje: MENSAJE_ESTADO_INVALIDO });
    }

    inscripcion.estado = estadoNormalizado;
    inscripcion.observacionAdministrativa = observacion?.trim() || null;
    inscripcion.fechaActualizacionEstado = new Date();
    inscripcion.revisadoPor = revisorId ?? null;

    const saved = await this.inscripcionRepository.save(inscripcion);
    await this.avisarPorCorreo(
      this.armarAviso(inscripcion, estadoNormalizado, observacion),
    );

    return {
      id: saved.id,
      mensaje: 'Estado de inscripción actualizado correctamente',
      estado: saved.estado,
      observacionAdministrativa: saved.observacionAdministrativa,
      fechaActualizacionEstado: saved.fechaActualizacionEstado!,
    };
  }

  private armarAviso(
    inscripcion: InscripcionCatequesis,
    estado: string,
    observacion?: string | null,
  ): AvisoInscripcionCatequesis {
    const nombreCatequizando =
      `${inscripcion.catequizando?.nombre ?? ''} ${unirApellidos(
        inscripcion.catequizando?.primerApellido,
        inscripcion.catequizando?.segundoApellido,
      )}`.trim() || 'el catequizando';

    return {
      id: inscripcion.id,
      correo: inscripcion.personaInscribe?.correo ?? null,
      nombreDestinatario: unirNombreEncargado(inscripcion) || 'encargado',
      nombreCatequizando,
      centroCatequesis: inscripcion.centroCatequesis,
      nivelAInscribirse: inscripcion.nivelAInscribirse,
      estado,
      observacion,
    };
  }

  private async avisarPorCorreo(
    aviso: AvisoInscripcionCatequesis,
  ): Promise<void> {
    try {
      await this.catequesisMail?.notificarEstado(aviso);
    } catch (error) {
      this.logger.warn(
        `No se pudo avisar por correo la inscripción ${aviso.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private validarReglasNegocio(dto: CrearInscripcionCatequesisDto): void {
    if (!validarFechaNoFutura(dto.datosCatequizando.fechaNacimiento)) {
      throw new BadRequestException({
        mensaje: MENSAJE_FECHA_NACIMIENTO_FUTURA,
      });
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
      fechaEnvio: inscripcion.fechaSolicitud,
      fechaRevision: inscripcion.fechaActualizacionEstado ?? null,
      telefonoEncargada:
        inscripcion.personaInscribe?.telefono ??
        inscripcion.madre?.telefono ??
        '',
      nombreEncargado,
      correoEncargado: inscripcion.personaInscribe?.correo ?? '',
      // motivo/observaciones únicamente para rechazadas; derivados de la observación persistida
      ...(inscripcion.estado === 'Rechazada'
        ? {
            motivoRechazo: inscripcion.observacionAdministrativa,
            observaciones: inscripcion.observacionAdministrativa,
          }
        : {}),
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
      fechaActualizacionEstado: inscripcion.fechaActualizacionEstado ?? null,
      feBautismoArchivo: inscripcion.feBautismoArchivo,
      observacionAdministrativa: inscripcion.observacionAdministrativa,
      // motivo/observaciones únicamente para rechazadas; derivados de la observación persistida
      ...(inscripcion.estado === 'Rechazada'
        ? {
            motivoRechazo: inscripcion.observacionAdministrativa,
            observaciones: inscripcion.observacionAdministrativa,
          }
        : {}),
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
