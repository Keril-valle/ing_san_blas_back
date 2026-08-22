import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { TipoSacramentoRegistro } from '../../Common/Enums/TipoSacramentoRegistro';
import { BuscarSacramentosNormalizadosDto } from './DTO/buscar-sacramentos-normalizados.dto';
import {
  CreateSacramentoNormalizadoDto,
  UpdateSacramentoNormalizadoDto,
} from './DTO/create-sacramento-normalizado.dto';
import { BautismoAbuelo } from './Entities/bautismo-abuelo.entity';
import { BautismoRegistro } from './Entities/bautismo-registro.entity';
import { ComunionRegistro } from './Entities/comunion-registro.entity';
import { ConfirmacionRegistro } from './Entities/confirmacion-registro.entity';
import { MatrimonioRegistro } from './Entities/matrimonio-registro.entity';
import { SacramentoRegistro } from './Entities/sacramento-registro.entity';

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
    const cedulaParam = cedula ? addParameter(cedula) : null;
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
          `(${personAliases.map((alias) => `lower(${alias}.nombre) LIKE lower(${nombreParam})`).join(' OR ')})`,
        );
      }
      if (apellidoParam) {
        where.push(
          `(${personAliases.map((alias) => `lower(${alias}.primer_apellido) LIKE lower(${apellidoParam}) OR lower(coalesce(${alias}.segundo_apellido, '')) LIKE lower(${apellidoParam})`).join(' OR ')})`,
        );
      }
      if (cedulaParam) {
        where.push(
          `(${personAliases.map((alias) => `lower(trim(${alias}.cedula)) = lower(trim(${cedulaParam}))`).join(' OR ')})`,
        );
      }
      if (desdeParam) where.push(`s.fecha_sacramento >= ${desdeParam}`);
      if (hastaParam) where.push(`s.fecha_sacramento <= ${hastaParam}`);
      return where;
    };

    const requestedTypes = filtros.tipo
      ? [filtros.tipo]
      : Object.values(TipoSacramentoRegistro);
    const unions: string[] = [];

    if (requestedTypes.includes(TipoSacramentoRegistro.Bautismo)) {
      unions.push(`
        SELECT s.id_sacramento AS id, s.tipo_sacramento AS tipo,
          concat_ws(' ', p.nombre, p.primer_apellido, p.segundo_apellido) AS nombre,
          p.cedula, s.fecha_sacramento AS fecha, pa.nombre AS parroquia
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
          p.cedula, s.fecha_sacramento AS fecha, pa.nombre AS parroquia
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
          p.cedula, s.fecha_sacramento AS fecha, pa.nombre AS parroquia
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
          concat_ws(' ', p1.nombre, p1.primer_apellido, p1.segundo_apellido)
            || ' y ' || concat_ws(' ', p2.nombre, p2.primer_apellido, p2.segundo_apellido) AS nombre,
          coalesce(p1.cedula, p2.cedula) AS cedula, s.fecha_sacramento AS fecha, pa.nombre AS parroquia
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
    const sortColumn =
      filtros.sortBy === 'nombre'
        ? 'nombre'
        : filtros.sortBy === 'tipo'
          ? 'tipo'
          : 'fecha';
    const sortDirection = filtros.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const offsetParam = addParameter((page - 1) * pageSize);
    const limitParam = addParameter(pageSize);
    const items = await this.dataSource.query(
      `SELECT id, tipo, nombre, cedula, fecha, parroquia
       FROM (${unionQuery}) AS resultados
       ORDER BY ${sortColumn} ${sortDirection}, id ASC
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
  async crear(dto: CreateSacramentoNormalizadoDto) {
    return this.dataSource.transaction(async (manager) => {
      this.validarDetalle(dto);
      await this.validarPrerequisitos(manager, dto);
      const parent = await manager.getRepository(SacramentoRegistro).save({
        tipo: dto.tipo,
        idParroquia: dto.idParroquia,
        idPresbitero: dto.idPresbitero ?? null,
        fechaSacramento: dto.fechaSacramento,
        observaciones: dto.observaciones ?? null,
      });

      await this.insertarDetalle(manager, parent.id, dto);
      return this.obtenerDetalle(manager, parent.id);
    }).catch((error: unknown) => this.convertirError(error));
  }

  // Devuelve un sacramento completo únicamente cuando se solicita su detalle.
  async obtener(id: number) {
    return this.dataSource.transaction((manager) => this.obtenerDetalle(manager, id));
  }

  // Actualiza el padre y el detalle conservando el tipo original del sacramento.
  async actualizar(id: number, dto: UpdateSacramentoNormalizadoDto) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SacramentoRegistro);
      const current = await repository.findOneBy({ id });
      if (!current) throw new NotFoundException('Sacramento no encontrado');
      if (dto.tipo && dto.tipo !== current.tipo) {
        throw new BadRequestException('El tipo de sacramento no se puede cambiar');
      }
      await this.validarPrerequisitosActualizacion(manager, id, current.tipo, dto);

      const changes: Partial<SacramentoRegistro> = {};
      if (dto.idParroquia !== undefined) changes.idParroquia = dto.idParroquia;
      if (dto.idPresbitero !== undefined) changes.idPresbitero = dto.idPresbitero;
      if (dto.fechaSacramento !== undefined) {
        changes.fechaSacramento = dto.fechaSacramento;
      }
      if (dto.observaciones !== undefined) changes.observaciones = dto.observaciones;
      if (Object.keys(changes).length > 0) await repository.update(id, changes);

      await this.actualizarDetalle(manager, id, current.tipo, dto);
      return this.obtenerDetalle(manager, id);
    }).catch((error: unknown) => this.convertirError(error));
  }

  // Elimina el padre y deja que las claves en cascada eliminen su detalle.
  async eliminar(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.getRepository(SacramentoRegistro).delete(id);
      if (!result.affected) throw new NotFoundException('Sacramento no encontrado');
    }).catch((error: unknown) => this.convertirError(error));
  }

  private validarDetalle(dto: CreateSacramentoNormalizadoDto): void {
    const detalle = dto[dto.tipo];
    if (!detalle) {
      throw new BadRequestException(
        `Debe enviar los datos específicos de ${dto.tipo}`,
      );
    }
    if (dto.tipo === TipoSacramentoRegistro.Matrimonio &&
      dto.matrimonio?.idContrayente1 === dto.matrimonio?.idContrayente2) {
      throw new BadRequestException('Los contrayentes deben ser diferentes');
    }
  }

  // Exige bautismo previo para los sacramentos que dependen de ese registro.
  private async validarPrerequisitos(
    manager: EntityManager,
    dto: CreateSacramentoNormalizadoDto,
  ): Promise<void> {
    if (dto.tipo === TipoSacramentoRegistro.Bautismo) return;

    const personas =
      dto.tipo === TipoSacramentoRegistro.Matrimonio
        ? [dto.matrimonio?.idContrayente1, dto.matrimonio?.idContrayente2]
        : [dto.comunion?.idPersona ?? dto.confirmacion?.idPersona];
    const ids = personas.filter((id): id is number => id !== undefined);
    await this.validarPersonasBautizadas(manager, ids);
  }

  private async validarPrerequisitosActualizacion(
    manager: EntityManager,
    id: number,
    tipo: TipoSacramentoRegistro,
    dto: UpdateSacramentoNormalizadoDto,
  ): Promise<void> {
    if (tipo === TipoSacramentoRegistro.Bautismo || !dto[tipo]) return;

    let ids: number[] = [];
    if (tipo === TipoSacramentoRegistro.Comunion) {
      const detalle = await manager.getRepository(ComunionRegistro).findOneBy({
        idSacramento: id,
      });
      ids = [dto.comunion?.idPersona ?? detalle?.idPersona].filter(
        (value): value is number => value !== undefined,
      );
    } else if (tipo === TipoSacramentoRegistro.Confirmacion) {
      const detalle = await manager.getRepository(ConfirmacionRegistro).findOneBy({
        idSacramento: id,
      });
      ids = [dto.confirmacion?.idPersona ?? detalle?.idPersona].filter(
        (value): value is number => value !== undefined,
      );
    } else {
      const detalle = await manager.getRepository(MatrimonioRegistro).findOneBy({
        idSacramento: id,
      });
      ids = [
        dto.matrimonio?.idContrayente1 ?? detalle?.idContrayente1,
        dto.matrimonio?.idContrayente2 ?? detalle?.idContrayente2,
      ].filter((value): value is number => value !== undefined);
    }
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

  private async insertarDetalle(
    manager: EntityManager,
    id: number,
    dto: CreateSacramentoNormalizadoDto,
  ): Promise<void> {
    switch (dto.tipo) {
      case TipoSacramentoRegistro.Bautismo:
        await manager.getRepository(BautismoRegistro).insert({
          idSacramento: id,
          ...dto.bautismo,
        });
        break;
      case TipoSacramentoRegistro.Comunion:
        await manager.getRepository(ComunionRegistro).insert({
          idSacramento: id,
          ...dto.comunion,
        });
        break;
      case TipoSacramentoRegistro.Confirmacion:
        await manager.getRepository(ConfirmacionRegistro).insert({
          idSacramento: id,
          ...dto.confirmacion,
        });
        break;
      case TipoSacramentoRegistro.Matrimonio:
        await manager.getRepository(MatrimonioRegistro).insert({
          idSacramento: id,
          ...dto.matrimonio,
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
    const detalle = dto[tipo];
    if (!detalle) return;
    if (tipo === TipoSacramentoRegistro.Matrimonio &&
      dto.matrimonio?.idContrayente1 !== undefined &&
      dto.matrimonio?.idContrayente2 !== undefined &&
      dto.matrimonio.idContrayente1 === dto.matrimonio.idContrayente2) {
      throw new BadRequestException('Los contrayentes deben ser diferentes');
    }

    if (tipo === TipoSacramentoRegistro.Bautismo) {
      await manager.getRepository(BautismoRegistro).update(
        { idSacramento: id },
        detalle as Partial<BautismoRegistro>,
      );
    } else if (tipo === TipoSacramentoRegistro.Comunion) {
      await manager.getRepository(ComunionRegistro).update(
        { idSacramento: id },
        detalle as Partial<ComunionRegistro>,
      );
    } else if (tipo === TipoSacramentoRegistro.Confirmacion) {
      await manager.getRepository(ConfirmacionRegistro).update(
        { idSacramento: id },
        detalle as Partial<ConfirmacionRegistro>,
      );
    } else {
      await manager.getRepository(MatrimonioRegistro).update(
        { idSacramento: id },
        detalle as Partial<MatrimonioRegistro>,
      );
    }
  }

  private async obtenerDetalle(manager: EntityManager, id: number) {
    const sacramento = await manager.getRepository(SacramentoRegistro).findOneBy({ id });
    if (!sacramento) throw new NotFoundException('Sacramento no encontrado');

    let detalle: unknown;
    if (sacramento.tipo === TipoSacramentoRegistro.Bautismo) {
      detalle = await manager.getRepository(BautismoRegistro).findOneBy({ idSacramento: id });
    } else if (sacramento.tipo === TipoSacramentoRegistro.Comunion) {
      detalle = await manager.getRepository(ComunionRegistro).findOneBy({ idSacramento: id });
    } else if (sacramento.tipo === TipoSacramentoRegistro.Confirmacion) {
      detalle = await manager.getRepository(ConfirmacionRegistro).findOneBy({ idSacramento: id });
    } else {
      detalle = await manager.getRepository(MatrimonioRegistro).findOneBy({ idSacramento: id });
    }

    return { ...sacramento, detalle };
  }

  private convertirError(error: unknown): never {
    if (error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException) throw error;
    if ((error as { code?: string })?.code === '23505') {
      throw new ConflictException('El registro ya existe');
    }
    if ((error as { code?: string })?.code === '23503') {
      throw new BadRequestException('Una relación indicada no existe');
    }
    throw error;
  }
}
