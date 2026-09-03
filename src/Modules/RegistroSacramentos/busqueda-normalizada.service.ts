import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { TipoSacramentoRegistro } from '../../Common/Enums/TipoSacramentoRegistro';
import { ParentescoAbueloRegistro } from '../../Common/Enums/ParentescoAbueloRegistro';
import { BuscarSacramentosNormalizadosDto } from './DTO/buscar-sacramentos-normalizados.dto';
import {
  BautismoDatosDto,
  CreateSacramentoNormalizadoDto,
  MatrimonioDatosDto,
  PersonaDetalleSacramentoDto,
  PersonaInputDto,
  UpdateSacramentoNormalizadoDto,
} from './DTO/create-sacramento-normalizado.dto';
import { BautismoAbuelo } from './Entities/bautismo-abuelo.entity';
import { BautismoRegistro } from './Entities/bautismo-registro.entity';
import { ComunionRegistro } from './Entities/comunion-registro.entity';
import { ConfirmacionRegistro } from './Entities/confirmacion-registro.entity';
import { MatrimonioRegistro } from './Entities/matrimonio-registro.entity';
import { PersonaSacramento } from './Entities/persona-sacramento.entity';
import { SacramentoRegistro } from './Entities/sacramento-registro.entity';
import { FILIALES_CELEBRACION_SACRAMENTAL } from './constants/filiales-celebracion';

interface SacramentoNormalizadoItem {
  id: number;
  tipo: TipoSacramentoRegistro;
  nombre: string;
  cedula: string | null;
  fecha: string;
  parroquia: string;
}

export interface ResultadoSacramentosNormalizados {
  items: SacramentoNormalizadoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BautismoResuelto {
  idBautizado: number;
  idPadre: number | null;
  idMadre: number | null;
  idPadrino: number | null;
  idMadrina: number | null;
  idDeclarante: number | null;
  abuelos: { idPersona: number; parentesco: ParentescoAbueloRegistro }[];
}

type PersonasResueltas =
  | { tipo: TipoSacramentoRegistro.Bautismo; bautismo: BautismoResuelto }
  | {
      tipo:
        TipoSacramentoRegistro.Comunion | TipoSacramentoRegistro.Confirmacion;
      idPersona: number;
    }
  | {
      tipo: TipoSacramentoRegistro.Matrimonio;
      idContrayente1: number;
      idContrayente2: number;
    };

@Injectable()
export class BusquedaNormalizadaService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Busca y pagina los sacramentos directamente en PostgreSQL.
  async buscar(
    filtros: BuscarSacramentosNormalizadosDto,
  ): Promise<ResultadoSacramentosNormalizados> {
    const page = filtros.page ?? 1;
    const pageSize = filtros.pageSize ?? 20;
    const parameters: unknown[] = [];

    const addParameter = (value: unknown): string => {
      parameters.push(value);
      return `$${parameters.length}`;
    };

    const nombre = filtros.nombre?.trim();
    const apellido = filtros.apellido?.trim();
    const cedula = filtros.cedula?.trim();
    const nombreParam = nombre ? addParameter(`%${nombre}%`) : null;
    const apellidoParam = apellido ? addParameter(`%${apellido}%`) : null;
    // La cédula se normaliza quitando guiones/espacios para que coincida tanto con
    // formatos "5-0463-0675" como "504630675", y se busca por coincidencia parcial.
    const cedulaParam = cedula
      ? addParameter(`%${cedula.replace(/[-\s]/g, '')}%`)
      : null;
    const desdeParam = filtros.fechaDesde
      ? addParameter(filtros.fechaDesde)
      : null;
    const hastaParam = filtros.fechaHasta
      ? addParameter(filtros.fechaHasta)
      : null;

    const conditions = (
      personAliases: string[],
      tipo: TipoSacramentoRegistro,
    ): string[] => {
      const where = [`s.tipo_sacramento = '${tipo}'`];

      if (nombreParam) {
        where.push(
          `(${personAliases.map((alias) => `lower(concat_ws(' ', ${alias}.nombre, ${alias}.primer_apellido, ${alias}.segundo_apellido)) LIKE lower(${nombreParam})`).join(' OR ')})`,
        );
      }
      if (apellidoParam) {
        where.push(
          `(${personAliases.map((alias) => `lower(${alias}.primer_apellido) LIKE lower(${apellidoParam}) OR lower(coalesce(${alias}.segundo_apellido, '')) LIKE lower(${apellidoParam})`).join(' OR ')})`,
        );
      }
      if (cedulaParam) {
        where.push(
          `(${personAliases.map((alias) => `replace(lower(trim(${alias}.cedula)), '-', '') LIKE lower(${cedulaParam})`).join(' OR ')})`,
        );
      }
      if (desdeParam) where.push(`s.fecha_sacramento >= ${desdeParam}`);
      if (hastaParam) where.push(`s.fecha_sacramento <= ${hastaParam}`);
      return where;
    };

    // Por defecto el listado trae solo bautismos: así una persona con varios
    // sacramentos (bautismo + comunión + ...) aparece una sola vez en la tabla.
    // El resto se consulta desde el detalle o la edición. Con filtro de tipo
    // sí se puede consultar un sacramento específico.
    const requestedTypes = filtros.tipo
      ? [filtros.tipo]
      : [TipoSacramentoRegistro.Bautismo];
    const unions: string[] = [];

    if (requestedTypes.includes(TipoSacramentoRegistro.Bautismo)) {
      unions.push(`
        SELECT s.id_sacramento AS id, s.tipo_sacramento AS tipo,
          concat_ws(' ', p.nombre, p.primer_apellido, p.segundo_apellido) AS nombre,
          p.cedula, s.fecha_sacramento AS fecha,
          to_char(s.creado_en AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD') AS "fechaRegistro",
          pa.nombre AS parroquia
        FROM sacramento s
        JOIN bautismo b ON b.id_sacramento = s.id_sacramento
        JOIN persona p ON p.id_persona = b.id_bautizado
        JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
        WHERE ${conditions(['p'], TipoSacramentoRegistro.Bautismo).join(' AND ')}
      `);
    }
    if (requestedTypes.includes(TipoSacramentoRegistro.Comunion)) {
      unions.push(`
        SELECT s.id_sacramento AS id, s.tipo_sacramento AS tipo,
          concat_ws(' ', p.nombre, p.primer_apellido, p.segundo_apellido) AS nombre,
          p.cedula, s.fecha_sacramento AS fecha,
          to_char(s.creado_en AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD') AS "fechaRegistro",
          pa.nombre AS parroquia
        FROM sacramento s
        JOIN comunion c ON c.id_sacramento = s.id_sacramento
        JOIN persona p ON p.id_persona = c.id_persona
        JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
        WHERE ${conditions(['p'], TipoSacramentoRegistro.Comunion).join(' AND ')}
      `);
    }
    if (requestedTypes.includes(TipoSacramentoRegistro.Confirmacion)) {
      unions.push(`
        SELECT s.id_sacramento AS id, s.tipo_sacramento AS tipo,
          concat_ws(' ', p.nombre, p.primer_apellido, p.segundo_apellido) AS nombre,
          p.cedula, s.fecha_sacramento AS fecha,
          to_char(s.creado_en AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD') AS "fechaRegistro",
          pa.nombre AS parroquia
        FROM sacramento s
        JOIN confirmacion c ON c.id_sacramento = s.id_sacramento
        JOIN persona p ON p.id_persona = c.id_persona
        JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
        WHERE ${conditions(['p'], TipoSacramentoRegistro.Confirmacion).join(' AND ')}
      `);
    }
    if (requestedTypes.includes(TipoSacramentoRegistro.Matrimonio)) {
      unions.push(`
        SELECT s.id_sacramento AS id, s.tipo_sacramento AS tipo,
          concat_ws(' ', p1.nombre, p1.primer_apellido, p1.segundo_apellido) AS nombre,
          coalesce(p1.cedula, p2.cedula) AS cedula, s.fecha_sacramento AS fecha,
          to_char(s.creado_en AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD') AS "fechaRegistro",
          pa.nombre AS parroquia
        FROM sacramento s
        JOIN matrimonio m ON m.id_sacramento = s.id_sacramento
        JOIN persona p1 ON p1.id_persona = m.id_contrayente1
        JOIN persona p2 ON p2.id_persona = m.id_contrayente2
        JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
        WHERE ${conditions(['p1', 'p2'], TipoSacramentoRegistro.Matrimonio).join(' AND ')}
      `);
    }

    const unionQuery = unions.join(' UNION ALL ');
    const countResult = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM (${unionQuery}) AS resultados`,
      parameters,
    );
    const total = Number(countResult[0]?.total ?? 0);
    // Orden por defecto: el último sacramento registrado aparece primero (id DESC).
    // Así el acta que se acaba de ingresar se ve arriba aunque su fecha de celebración sea antigua.
    const sortColumn =
      !filtros.sortBy
        ? 'id'
        : filtros.sortBy === 'nombre'
          ? 'nombre'
          : filtros.sortBy === 'tipo'
            ? 'tipo'
            : 'fecha';
    const sortDirection = filtros.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const offsetParam = addParameter((page - 1) * pageSize);
    const limitParam = addParameter(pageSize);
    const items = await this.dataSource.query(
      `SELECT id, tipo, nombre, cedula, fecha, "fechaRegistro", parroquia
       FROM (${unionQuery}) AS resultados
       ORDER BY ${sortColumn} ${sortDirection}, id DESC
       OFFSET ${offsetParam} LIMIT ${limitParam}`,
      parameters,
    );

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // Crea el registro padre y su detalle dentro de una única transacción.
  // Las personas se buscan por cédula o se crean automáticamente.
  async crear(dto: CreateSacramentoNormalizadoDto) {
    return this.dataSource
      .transaction(async (manager) => {
        this.validarDetalle(dto);
        const personas = await this.resolverPersonas(manager, dto);
        await this.validarPrerequisitos(manager, personas);
        await this.validarSinDuplicado(manager, personas);
        const parent = await manager.getRepository(SacramentoRegistro).save({
          tipo: dto.tipo,
          idParroquia: dto.idParroquia,
          idPresbitero: dto.idPresbitero ?? null,
          fechaSacramento: dto.fechaSacramento,
          observaciones: dto.observaciones ?? null,
        });

        await this.insertarDetalle(manager, parent.id, dto, personas);
        return this.obtenerDetalle(manager, parent.id);
      })
      .catch((error: unknown) => this.convertirError(error));
  }

  // Devuelve un sacramento completo únicamente cuando se solicita su detalle.
  async obtener(id: number) {
    return this.dataSource.transaction((manager) =>
      this.obtenerDetalle(manager, id),
    );
  }

  // Devuelve todos los sacramentos de una persona (por cédula exacta) agrupados.
  async obtenerSacramentosPorCedula(cedula: string) {
    return this.dataSource
      .transaction(async (manager) => {
        const personas = await manager.query(
          `SELECT id_persona AS id, cedula, nombre,
                primer_apellido AS "primerApellido",
                segundo_apellido AS "segundoApellido",
                nacionalidad
         FROM persona
         WHERE lower(trim(cedula)) = lower(trim($1))`,
          [cedula],
        );
        const persona = personas[0];
        if (!persona) throw new NotFoundException('Persona no encontrada');

        const [bautismo, comunion, confirmacion, matrimonio] =
          await Promise.all([
            this.queryDetalleBautismo(manager, 'b.id_bautizado = $1', [
              persona.id,
            ]),
            this.queryDetalleComunion(manager, 'c.id_persona = $1', [
              persona.id,
            ]),
            this.queryDetalleConfirmacion(manager, 'cf.id_persona = $1', [
              persona.id,
            ]),
            this.queryDetalleMatrimonio(
              manager,
              '(m.id_contrayente1 = $1 OR m.id_contrayente2 = $1)',
              [persona.id],
            ),
          ]);

        return { persona, bautismo, comunion, confirmacion, matrimonio };
      })
      .catch((error: unknown) => this.convertirError(error));
  }

  // Catálogo de filiales para el lugar de celebración sacramental.
  async listarParroquias() {
    await this.dataSource.query(
      `
      INSERT INTO parroquia (nombre)
      SELECT f.nombre
      FROM unnest($1::text[]) AS f(nombre)
      WHERE NOT EXISTS (
        SELECT 1 FROM parroquia p WHERE p.nombre = f.nombre
      )
      `,
      [FILIALES_CELEBRACION_SACRAMENTAL],
    );

    return this.dataSource.query(
      `
      SELECT p.id_parroquia AS id, p.nombre, p.canton, p.provincia
      FROM parroquia p
      JOIN unnest($1::text[]) WITH ORDINALITY AS f(nombre, orden)
        ON f.nombre = p.nombre
      ORDER BY f.orden
      `,
      [FILIALES_CELEBRACION_SACRAMENTAL],
    );
  }

  // Catálogo de presbíteros para el selector del formulario.
  async listarPresbiteros() {
    return this.dataSource.query(
      `SELECT id_presbitero AS id, nombre,
              primer_apellido AS "primerApellido",
              segundo_apellido AS "segundoApellido"
       FROM presbitero ORDER BY nombre ASC`,
    );
  }

  // Actualiza el padre y el detalle conservando el tipo original del sacramento.
  async actualizar(id: number, dto: UpdateSacramentoNormalizadoDto) {
    return this.dataSource
      .transaction(async (manager) => {
        const repository = manager.getRepository(SacramentoRegistro);
        const current = await repository.findOneBy({ id });
        if (!current) throw new NotFoundException('Sacramento no encontrado');
        if (dto.tipo && dto.tipo !== current.tipo) {
          throw new BadRequestException(
            'El tipo de sacramento no se puede cambiar',
          );
        }

        const changes: Partial<SacramentoRegistro> = {};
        if (dto.idParroquia !== undefined)
          changes.idParroquia = dto.idParroquia;
        if (dto.idPresbitero !== undefined)
          changes.idPresbitero = dto.idPresbitero;
        if (dto.fechaSacramento !== undefined) {
          changes.fechaSacramento = dto.fechaSacramento;
        }
        if (dto.observaciones !== undefined)
          changes.observaciones = dto.observaciones;
        if (Object.keys(changes).length > 0)
          await repository.update(id, changes);

        await this.actualizarDetalle(manager, id, current.tipo, dto);
        return this.obtenerDetalle(manager, id);
      })
      .catch((error: unknown) => this.convertirError(error));
  }

  // Elimina el padre y deja que las claves en cascada eliminen su detalle.
  async eliminar(id: number): Promise<void> {
    await this.dataSource
      .transaction(async (manager) => {
        const result = await manager
          .getRepository(SacramentoRegistro)
          .delete(id);
        if (!result.affected)
          throw new NotFoundException('Sacramento no encontrado');
      })
      .catch((error: unknown) => this.convertirError(error));
  }

  private validarDetalle(dto: CreateSacramentoNormalizadoDto): void {
    const detalle = dto[dto.tipo];
    if (!detalle) {
      throw new BadRequestException(
        `Debe enviar los datos específicos de ${dto.tipo}`,
      );
    }
  }

  // Resuelve las personas de la sección correspondiente (busca o crea).
  private async resolverPersonas(
    manager: EntityManager,
    dto: CreateSacramentoNormalizadoDto,
  ): Promise<PersonasResueltas> {
    switch (dto.tipo) {
      case TipoSacramentoRegistro.Bautismo:
        return {
          tipo: dto.tipo,
          bautismo: await this.resolverBautismo(manager, dto.bautismo!),
        };
      case TipoSacramentoRegistro.Comunion:
        return {
          tipo: dto.tipo,
          idPersona: await this.resolverPersonaDetalle(manager, dto.comunion!),
        };
      case TipoSacramentoRegistro.Confirmacion:
        return {
          tipo: dto.tipo,
          idPersona: await this.resolverPersonaDetalle(
            manager,
            dto.confirmacion!,
          ),
        };
      case TipoSacramentoRegistro.Matrimonio:
        return {
          tipo: dto.tipo,
          ...(await this.resolverMatrimonio(manager, dto.matrimonio!)),
        };
    }
  }

  // Busca o crea una persona y devuelve su id.
  private async resolverOcrearPersona(
    manager: EntityManager,
    input: PersonaInputDto,
  ): Promise<number> {
    const repo = manager.getRepository(PersonaSacramento);
    const cedula = input.cedula?.trim() || null;
    const nombre = input.nombre.trim();
    const primerApellido = input.primerApellido?.trim() || '';
    const segundoApellido = input.segundoApellido?.trim() || null;

    let existente: PersonaSacramento | null = null;
    if (cedula) {
      // La cédula tiene un índice único con lower(trim()), así la coincidencia es exacta
      existente = await repo
        .createQueryBuilder('p')
        .where('lower(trim(p.cedula)) = lower(trim(:cedula))', { cedula })
        .getOne();
    } else {
      // Sin cédula (menores) se busca por nombre completo para no duplicar
      existente = await repo
        .createQueryBuilder('p')
        .where('lower(p.nombre) = lower(:nombre)', { nombre })
        .andWhere('lower(p.primer_apellido) = lower(:primerApellido)', {
          primerApellido,
        })
        .andWhere(
          `lower(coalesce(p.segundo_apellido, '')) = lower(coalesce(:segundoApellido, ''))`,
          { segundoApellido },
        )
        .getOne();
    }

    if (existente) {
      // Si la persona ya existe (por cédula), actualiza sus datos con lo que envió
      // el formulario para que cambios de nombre/apellidos queden reflejados en el front.
      const nacionalidad = input.nacionalidad?.trim() || null;
      const hayCambios =
        existente.nombre !== nombre ||
        existente.primerApellido !== primerApellido ||
        existente.segundoApellido !== segundoApellido ||
        existente.nacionalidad !== nacionalidad;
      if (hayCambios) {
        await repo.update(existente.id, {
          nombre,
          primerApellido,
          segundoApellido,
          nacionalidad,
        });
      }
      return existente.id;
    }

    const nuevo = await repo.save({
      cedula,
      nombre,
      primerApellido,
      segundoApellido,
      nacionalidad: input.nacionalidad?.trim() || null,
    });
    return nuevo.id;
  }

  private async resolverBautismo(
    manager: EntityManager,
    bautismo: BautismoDatosDto,
  ): Promise<BautismoResuelto> {
    const bautizado = await this.resolverOcrearPersona(
      manager,
      bautismo.bautizado,
    );
    const padre = bautismo.padre
      ? await this.resolverOcrearPersona(manager, bautismo.padre)
      : null;
    const madre = bautismo.madre
      ? await this.resolverOcrearPersona(manager, bautismo.madre)
      : null;
    const padrino = bautismo.padrino
      ? await this.resolverOcrearPersona(manager, bautismo.padrino)
      : null;
    const madrina = bautismo.madrina
      ? await this.resolverOcrearPersona(manager, bautismo.madrina)
      : null;
    const declarante = bautismo.declarante
      ? await this.resolverOcrearPersona(manager, bautismo.declarante)
      : null;
    const abuelos = bautismo.abuelos?.length
      ? await Promise.all(
          bautismo.abuelos.map(async (abuelo) => ({
            idPersona: await this.resolverOcrearPersona(manager, abuelo),
            parentesco: abuelo.parentesco,
          })),
        )
      : [];

    // No se puede repetir el mismo parentesco en el mismo bautismo (índice único)
    const vistos = new Set<string>();
    for (const abuelo of abuelos) {
      if (vistos.has(abuelo.parentesco)) {
        throw new BadRequestException(
          'No puede registrar dos abuelos con el mismo parentesco',
        );
      }
      vistos.add(abuelo.parentesco);
    }

    return {
      idBautizado: bautizado,
      idPadre: padre,
      idMadre: madre,
      idPadrino: padrino,
      idMadrina: madrina,
      idDeclarante: declarante,
      abuelos,
    };
  }

  private async resolverPersonaDetalle(
    manager: EntityManager,
    detalle: PersonaDetalleSacramentoDto,
  ): Promise<number> {
    return this.resolverOcrearPersona(manager, detalle.persona);
  }

  private async resolverMatrimonio(
    manager: EntityManager,
    matrimonio: MatrimonioDatosDto,
  ): Promise<{ idContrayente1: number; idContrayente2: number }> {
    const contrayente1 = await this.resolverOcrearPersona(
      manager,
      matrimonio.contrayente1,
    );
    const contrayente2 = await this.resolverOcrearPersona(
      manager,
      matrimonio.contrayente2,
    );
    if (contrayente1 === contrayente2) {
      throw new BadRequestException('Los contrayentes deben ser diferentes');
    }
    return { idContrayente1: contrayente1, idContrayente2: contrayente2 };
  }

  // Exige bautismo previo para los sacramentos que dependen de ese registro.
  private async validarPrerequisitos(
    manager: EntityManager,
    personas: PersonasResueltas,
  ): Promise<void> {
    if (personas.tipo === TipoSacramentoRegistro.Bautismo) return;

    const ids =
      personas.tipo === TipoSacramentoRegistro.Matrimonio
        ? [personas.idContrayente1, personas.idContrayente2]
        : [personas.idPersona];
    await this.validarPersonasBautizadas(manager, ids);
  }

  private async validarPersonasBautizadas(
    manager: EntityManager,
    ids: number[],
  ): Promise<void> {
    const bautismos = await Promise.all(
      ids.map((id) =>
        manager.getRepository(BautismoRegistro).findOneBy({ idBautizado: id }),
      ),
    );

    if (bautismos.some((bautismo) => !bautismo)) {
      throw new BadRequestException(
        'La persona debe tener un bautismo registrado antes de agregar este sacramento',
      );
    }
  }

  // Evita registrar dos veces el mismo sacramento para la misma persona:
  // la cédula de una persona bautizada no se puede repetir en otro bautismo.
  private async validarSinDuplicado(
    manager: EntityManager,
    personas: PersonasResueltas,
  ): Promise<void> {
    if (personas.tipo === TipoSacramentoRegistro.Bautismo) {
      const yaExiste = await manager
        .getRepository(BautismoRegistro)
        .findOneBy({ idBautizado: personas.bautismo.idBautizado });
      if (yaExiste) {
        throw new ConflictException(
          'Esta persona ya tiene un bautismo registrado',
        );
      }
      return;
    }
    if (personas.tipo === TipoSacramentoRegistro.Comunion) {
      const yaExiste = await manager
        .getRepository(ComunionRegistro)
        .findOneBy({ idPersona: personas.idPersona });
      if (yaExiste) {
        throw new ConflictException(
          'Esta persona ya tiene registrada la comunión',
        );
      }
      return;
    }
    if (personas.tipo === TipoSacramentoRegistro.Confirmacion) {
      const yaExiste = await manager
        .getRepository(ConfirmacionRegistro)
        .findOneBy({ idPersona: personas.idPersona });
      if (yaExiste) {
        throw new ConflictException(
          'Esta persona ya tiene registrada la confirmación',
        );
      }
    }
  }

  private async insertarDetalle(
    manager: EntityManager,
    id: number,
    dto: CreateSacramentoNormalizadoDto,
    personas: PersonasResueltas,
  ): Promise<void> {
    switch (personas.tipo) {
      case TipoSacramentoRegistro.Bautismo:
        await manager.getRepository(BautismoRegistro).insert({
          idSacramento: id,
          idBautizado: personas.bautismo.idBautizado,
          idPadre: personas.bautismo.idPadre,
          idMadre: personas.bautismo.idMadre,
          idPadrino: personas.bautismo.idPadrino,
          idMadrina: personas.bautismo.idMadrina,
          idDeclarante: personas.bautismo.idDeclarante,
          fechaNacimiento: dto.bautismo?.fechaNacimiento ?? null,
          horaNacimiento: dto.bautismo?.horaNacimiento ?? null,
          lugarNacimiento: dto.bautismo?.lugarNacimiento ?? null,
          reconocimientoLegal: dto.bautismo?.reconocimientoLegal ?? null,
          libro: dto.bautismo?.libro ?? null,
          tomo: dto.bautismo?.tomo ?? null,
          folio: dto.bautismo?.folio ?? null,
          asiento: dto.bautismo?.asiento ?? null,
          firmaParroco: dto.bautismo?.firmaParroco ?? null,
        });
        if (personas.bautismo.abuelos.length > 0) {
          await manager.getRepository(BautismoAbuelo).insert(
            personas.bautismo.abuelos.map((abuelo) => ({
              idBautismo: id,
              idPersona: abuelo.idPersona,
              parentesco: abuelo.parentesco,
            })),
          );
        }
        break;
      case TipoSacramentoRegistro.Comunion:
        await manager.getRepository(ComunionRegistro).insert({
          idSacramento: id,
          idPersona: personas.idPersona,
        });
        break;
      case TipoSacramentoRegistro.Confirmacion:
        await manager.getRepository(ConfirmacionRegistro).insert({
          idSacramento: id,
          idPersona: personas.idPersona,
        });
        break;
      case TipoSacramentoRegistro.Matrimonio:
        await manager.getRepository(MatrimonioRegistro).insert({
          idSacramento: id,
          idContrayente1: personas.idContrayente1,
          idContrayente2: personas.idContrayente2,
          libro: dto.matrimonio?.libro ?? null,
          tomo: dto.matrimonio?.tomo ?? null,
          folio: dto.matrimonio?.folio ?? null,
          asiento: dto.matrimonio?.asiento ?? null,
          firmaParroco: dto.matrimonio?.firmaParroco ?? null,
        });
        break;
    }
  }

  private async actualizarDetalle(
    manager: EntityManager,
    id: number,
    tipo: TipoSacramentoRegistro,
    dto: UpdateSacramentoNormalizadoDto,
  ): Promise<void> {
    const seccion = dto[tipo];
    if (!seccion) return;

    switch (tipo) {
      case TipoSacramentoRegistro.Bautismo: {
        const bautismo = seccion as BautismoDatosDto;
        const resuelto = await this.resolverBautismo(manager, bautismo);
        await manager.getRepository(BautismoRegistro).update(
          { idSacramento: id },
          {
            idBautizado: resuelto.idBautizado,
            idPadre: resuelto.idPadre,
            idMadre: resuelto.idMadre,
            idPadrino: resuelto.idPadrino,
            idMadrina: resuelto.idMadrina,
            idDeclarante: resuelto.idDeclarante,
            ...(bautismo.fechaNacimiento !== undefined
              ? { fechaNacimiento: bautismo.fechaNacimiento }
              : {}),
            ...(bautismo.horaNacimiento !== undefined
              ? { horaNacimiento: bautismo.horaNacimiento }
              : {}),
            ...(bautismo.lugarNacimiento !== undefined
              ? { lugarNacimiento: bautismo.lugarNacimiento }
              : {}),
            ...(bautismo.reconocimientoLegal !== undefined
              ? { reconocimientoLegal: bautismo.reconocimientoLegal }
              : {}),
            ...(bautismo.libro !== undefined ? { libro: bautismo.libro } : {}),
            ...(bautismo.tomo !== undefined ? { tomo: bautismo.tomo } : {}),
            ...(bautismo.folio !== undefined ? { folio: bautismo.folio } : {}),
            ...(bautismo.asiento !== undefined
              ? { asiento: bautismo.asiento }
              : {}),
            ...(bautismo.firmaParroco !== undefined
              ? { firmaParroco: bautismo.firmaParroco }
              : {}),
          },
        );
        if (bautismo.abuelos) {
          await manager
            .getRepository(BautismoAbuelo)
            .delete({ idBautismo: id });
          if (resuelto.abuelos.length > 0) {
            await manager.getRepository(BautismoAbuelo).insert(
              resuelto.abuelos.map((abuelo) => ({
                idBautismo: id,
                idPersona: abuelo.idPersona,
                parentesco: abuelo.parentesco,
              })),
            );
          }
        }
        break;
      }
      case TipoSacramentoRegistro.Comunion: {
        const idPersona = await this.resolverPersonaDetalle(
          manager,
          seccion as PersonaDetalleSacramentoDto,
        );
        // No se revalida el bautismo al actualizar: el registro ya existe y fue validado al crearse,
        // así el PUT funciona con actas ya existentes aunque el bautismo venga de datos previos.
        await manager
          .getRepository(ComunionRegistro)
          .update({ idSacramento: id }, { idPersona });
        break;
      }
      case TipoSacramentoRegistro.Confirmacion: {
        const idPersona = await this.resolverPersonaDetalle(
          manager,
          seccion as PersonaDetalleSacramentoDto,
        );
        await manager
          .getRepository(ConfirmacionRegistro)
          .update({ idSacramento: id }, { idPersona });
        break;
      }
      case TipoSacramentoRegistro.Matrimonio: {
        const matrimonio = seccion as MatrimonioDatosDto;
        const resuelto = await this.resolverMatrimonio(manager, matrimonio);
        await manager.getRepository(MatrimonioRegistro).update(
          { idSacramento: id },
          {
            idContrayente1: resuelto.idContrayente1,
            idContrayente2: resuelto.idContrayente2,
            ...(matrimonio.libro !== undefined
              ? { libro: matrimonio.libro }
              : {}),
            ...(matrimonio.tomo !== undefined ? { tomo: matrimonio.tomo } : {}),
            ...(matrimonio.folio !== undefined
              ? { folio: matrimonio.folio }
              : {}),
            ...(matrimonio.asiento !== undefined
              ? { asiento: matrimonio.asiento }
              : {}),
            ...(matrimonio.firmaParroco !== undefined
              ? { firmaParroco: matrimonio.firmaParroco }
              : {}),
          },
        );
        break;
      }
    }
  }

  private async obtenerDetalle(manager: EntityManager, id: number) {
    const sacramento = await manager
      .getRepository(SacramentoRegistro)
      .findOneBy({ id });
    if (!sacramento) throw new NotFoundException('Sacramento no encontrado');

    if (sacramento.tipo === TipoSacramentoRegistro.Bautismo) {
      return this.queryDetalleBautismo(manager, 's.id_sacramento = $1', [id]);
    }
    if (sacramento.tipo === TipoSacramentoRegistro.Comunion) {
      return this.queryDetalleComunion(manager, 's.id_sacramento = $1', [id]);
    }
    if (sacramento.tipo === TipoSacramentoRegistro.Confirmacion) {
      return this.queryDetalleConfirmacion(manager, 's.id_sacramento = $1', [
        id,
      ]);
    }
    return this.queryDetalleMatrimonio(manager, 's.id_sacramento = $1', [id]);
  }

  // Fragmento JSON reutilizable para representar a una persona con nombre y apellidos.
  private personaJson(alias: string): string {
    return `json_build_object('id', ${alias}.id_persona, 'cedula', ${alias}.cedula, 'nombre', ${alias}.nombre, 'primerApellido', ${alias}.primer_apellido, 'segundoApellido', ${alias}.segundo_apellido, 'nacionalidad', ${alias}.nacionalidad)`;
  }

  // Detalle de bautismo con bautizado, padres, padrinos, declarante y abuelos.
  private async queryDetalleBautismo(
    manager: EntityManager,
    where: string,
    params: unknown[],
  ): Promise<Record<string, unknown> | null> {
    const rows = await manager.query(
      `
      SELECT
        s.id_sacramento AS id,
        s.tipo_sacramento AS tipo,
        to_char(s.fecha_sacramento, 'YYYY-MM-DD') AS "fechaSacramento",
        s.observaciones,
        json_build_object('id', pa.id_parroquia, 'nombre', pa.nombre, 'barrio', pa.barrio, 'distrito', pa.distrito, 'canton', pa.canton, 'provincia', pa.provincia) AS parroquia,
        CASE WHEN pr.id_presbitero IS NOT NULL
          THEN json_build_object('id', pr.id_presbitero, 'nombre', pr.nombre, 'primer_apellido', pr.primer_apellido, 'segundo_apellido', pr.segundo_apellido)
          ELSE NULL END AS presbitero,
        json_build_object(
          'bautizado', ${this.personaJson('bt')},
          'padre', CASE WHEN b.id_padre IS NOT NULL THEN ${this.personaJson('pd')} ELSE NULL END,
          'madre', CASE WHEN b.id_madre IS NOT NULL THEN ${this.personaJson('md')} ELSE NULL END,
          'padrino', CASE WHEN b.id_padrino IS NOT NULL THEN ${this.personaJson('pn')} ELSE NULL END,
          'madrina', CASE WHEN b.id_madrina IS NOT NULL THEN ${this.personaJson('mn')} ELSE NULL END,
          'declarante', CASE WHEN b.id_declarante IS NOT NULL THEN ${this.personaJson('dc')} ELSE NULL END,
          'abuelos', COALESCE((
            SELECT json_agg(json_build_object('id', gp.id_persona, 'cedula', gp.cedula, 'nombre', gp.nombre, 'primer_apellido', gp.primer_apellido, 'segundo_apellido', gp.segundo_apellido, 'parentesco', ba.parentesco))
            FROM bautismo_abuelo ba
            JOIN persona gp ON gp.id_persona = ba.id_persona
            WHERE ba.id_bautismo = b.id_sacramento
          ), '[]'::json),
          'fechaNacimiento', to_char(b.fecha_nacimiento, 'YYYY-MM-DD'),
          'horaNacimiento', b.hora_nacimiento::text,
          'lugarNacimiento', b.lugar_nacimiento,
          'reconocimientoLegal', b.reconocimiento_legal,
          'libro', b.libro, 'tomo', b.tomo, 'folio', b.folio, 'asiento', b.asiento, 'firmaParroco', b.firma_parroco
        ) AS detalle
      FROM sacramento s
      JOIN bautismo b ON b.id_sacramento = s.id_sacramento
      JOIN persona bt ON bt.id_persona = b.id_bautizado
      JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
      LEFT JOIN presbitero pr ON pr.id_presbitero = s.id_presbitero
      LEFT JOIN persona pd ON pd.id_persona = b.id_padre
      LEFT JOIN persona md ON md.id_persona = b.id_madre
      LEFT JOIN persona pn ON pn.id_persona = b.id_padrino
      LEFT JOIN persona mn ON mn.id_persona = b.id_madrina
      LEFT JOIN persona dc ON dc.id_persona = b.id_declarante
      WHERE ${where}
      ORDER BY s.fecha_sacramento DESC
      LIMIT 1
    `,
      params,
    );
    return rows[0] ?? null;
  }

  // Detalle de comunión con la persona que la recibió.
  private async queryDetalleComunion(
    manager: EntityManager,
    where: string,
    params: unknown[],
  ): Promise<Record<string, unknown> | null> {
    const rows = await manager.query(
      `
      SELECT
        s.id_sacramento AS id,
        s.tipo_sacramento AS tipo,
        to_char(s.fecha_sacramento, 'YYYY-MM-DD') AS "fechaSacramento",
        s.observaciones,
        json_build_object('id', pa.id_parroquia, 'nombre', pa.nombre, 'barrio', pa.barrio, 'distrito', pa.distrito, 'canton', pa.canton, 'provincia', pa.provincia) AS parroquia,
        CASE WHEN pr.id_presbitero IS NOT NULL
          THEN json_build_object('id', pr.id_presbitero, 'nombre', pr.nombre, 'primer_apellido', pr.primer_apellido, 'segundo_apellido', pr.segundo_apellido)
          ELSE NULL END AS presbitero,
        json_build_object('persona', ${this.personaJson('p')}) AS detalle
      FROM sacramento s
      JOIN comunion c ON c.id_sacramento = s.id_sacramento
      JOIN persona p ON p.id_persona = c.id_persona
      JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
      LEFT JOIN presbitero pr ON pr.id_presbitero = s.id_presbitero
      WHERE ${where}
      ORDER BY s.fecha_sacramento DESC
      LIMIT 1
    `,
      params,
    );
    return rows[0] ?? null;
  }

  // Detalle de confirmación con la persona confirmada.
  private async queryDetalleConfirmacion(
    manager: EntityManager,
    where: string,
    params: unknown[],
  ): Promise<Record<string, unknown> | null> {
    const rows = await manager.query(
      `
      SELECT
        s.id_sacramento AS id,
        s.tipo_sacramento AS tipo,
        to_char(s.fecha_sacramento, 'YYYY-MM-DD') AS "fechaSacramento",
        s.observaciones,
        json_build_object('id', pa.id_parroquia, 'nombre', pa.nombre, 'barrio', pa.barrio, 'distrito', pa.distrito, 'canton', pa.canton, 'provincia', pa.provincia) AS parroquia,
        CASE WHEN pr.id_presbitero IS NOT NULL
          THEN json_build_object('id', pr.id_presbitero, 'nombre', pr.nombre, 'primer_apellido', pr.primer_apellido, 'segundo_apellido', pr.segundo_apellido)
          ELSE NULL END AS presbitero,
        json_build_object('persona', ${this.personaJson('p')}) AS detalle
      FROM sacramento s
      JOIN confirmacion cf ON cf.id_sacramento = s.id_sacramento
      JOIN persona p ON p.id_persona = cf.id_persona
      JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
      LEFT JOIN presbitero pr ON pr.id_presbitero = s.id_presbitero
      WHERE ${where}
      ORDER BY s.fecha_sacramento DESC
      LIMIT 1
    `,
      params,
    );
    return rows[0] ?? null;
  }

  // Detalle de matrimonio con ambos contrayentes.
  private async queryDetalleMatrimonio(
    manager: EntityManager,
    where: string,
    params: unknown[],
  ): Promise<Record<string, unknown> | null> {
    const rows = await manager.query(
      `
      SELECT
        s.id_sacramento AS id,
        s.tipo_sacramento AS tipo,
        to_char(s.fecha_sacramento, 'YYYY-MM-DD') AS "fechaSacramento",
        s.observaciones,
        json_build_object('id', pa.id_parroquia, 'nombre', pa.nombre, 'barrio', pa.barrio, 'distrito', pa.distrito, 'canton', pa.canton, 'provincia', pa.provincia) AS parroquia,
        CASE WHEN pr.id_presbitero IS NOT NULL
          THEN json_build_object('id', pr.id_presbitero, 'nombre', pr.nombre, 'primer_apellido', pr.primer_apellido, 'segundo_apellido', pr.segundo_apellido)
          ELSE NULL END AS presbitero,
        json_build_object(
          'contrayente1', ${this.personaJson('c1')},
          'contrayente2', ${this.personaJson('c2')},
          'libro', m.libro, 'tomo', m.tomo, 'folio', m.folio, 'asiento', m.asiento, 'firmaParroco', m.firma_parroco
        ) AS detalle
      FROM sacramento s
      JOIN matrimonio m ON m.id_sacramento = s.id_sacramento
      JOIN persona c1 ON c1.id_persona = m.id_contrayente1
      JOIN persona c2 ON c2.id_persona = m.id_contrayente2
      JOIN parroquia pa ON pa.id_parroquia = s.id_parroquia
      LEFT JOIN presbitero pr ON pr.id_presbitero = s.id_presbitero
      WHERE ${where}
      ORDER BY s.fecha_sacramento DESC
      LIMIT 1
    `,
      params,
    );
    return rows[0] ?? null;
  }

  private convertirError(error: unknown): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException
    )
      throw error;
    if ((error as { code?: string })?.code === '23505') {
      throw new ConflictException('El registro ya existe');
    }
    if ((error as { code?: string })?.code === '23503') {
      throw new BadRequestException('Una relación indicada no existe');
    }
    throw error;
  }
}
