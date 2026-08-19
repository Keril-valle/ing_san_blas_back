import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Bautismo } from './Entities/bautismo.entity';
import { Comunion } from './Entities/comunion.entity';
import { Confirmacion } from './Entities/confirmacion.entity';
import { Matrimonio } from './Entities/matrimonio.entity';
import { BuscarSacramentosDto } from './DTO/buscar-sacramentos.dto';
import {
  PaginadoSacramentosDto,
  SacramentoUnificadoDto,
  TipoSacramento,
} from './DTO/sacramento-unificado.dto';
import {
  fechaISODesdeDDMMAAAA,
  fechaISODesdePartes,
} from './Utils/fechas-sacramentos.util';

interface ItemInterno {
  dto: SacramentoUnificadoDto;
  fechaISO: string | null;
}

@Injectable()
export class BusquedaSacramentosService {
  constructor(
    @InjectRepository(Bautismo)
    private readonly bautismoRepository: Repository<Bautismo>,
    @InjectRepository(Comunion)
    private readonly comunionRepository: Repository<Comunion>,
    @InjectRepository(Confirmacion)
    private readonly confirmacionRepository: Repository<Confirmacion>,
    @InjectRepository(Matrimonio)
    private readonly matrimonioRepository: Repository<Matrimonio>,
  ) {}

  async buscar(filtros: BuscarSacramentosDto): Promise<PaginadoSacramentosDto> {
    const nombre = filtros.nombre?.trim();
    const cedula = filtros.cedula?.trim();
    const page = filtros.page ?? 1;
    const pageSize = filtros.pageSize ?? 10;

    // Filtro de fecha (rango o exacta) convertido a ISO para comparar en memoria.
    const fechaExactaISO = fechaISODesdeDDMMAAAA(filtros.fecha);
    const desdeISO = fechaISODesdeDDMMAAAA(filtros.fechaDesde);
    const hastaISO = fechaISODesdeDDMMAAAA(filtros.fechaHasta);
    const filtroFechaDesde = fechaExactaISO ?? desdeISO;
    const filtroFechaHasta = fechaExactaISO ?? hastaISO;

    const resultados = await Promise.all([
      this.buscarBautismos(nombre, cedula),
      cedula ? this.buscarComunionesVacio() : this.buscarComuniones(nombre),
      cedula ? this.buscarConfirmacionesVacio() : this.buscarConfirmaciones(nombre),
      cedula ? this.buscarMatrimoniosVacio() : this.buscarMatrimonios(nombre),
    ]);

    let todos = resultados.flat();

    if (filtroFechaDesde || filtroFechaHasta) {
      todos = todos.filter((item) => {
        if (!item.fechaISO) {
          return false;
        }
        if (filtroFechaDesde && item.fechaISO < filtroFechaDesde) {
          return false;
        }
        if (filtroFechaHasta && item.fechaISO > filtroFechaHasta) {
          return false;
        }
        return true;
      });
    }

    // Orden por defecto: fecha de celebración descendente.
    todos.sort((a, b) => {
      if (!a.fechaISO && !b.fechaISO) return 0;
      if (!a.fechaISO) return 1;
      if (!b.fechaISO) return -1;
      return b.fechaISO.localeCompare(a.fechaISO);
    });

    const total = todos.length;
    const inicio = (page - 1) * pageSize;
    const pagina = todos.slice(inicio, inicio + pageSize).map((item) => item.dto);

    return {
      items: pagina,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private async buscarBautismos(
    nombre?: string,
    cedula?: string,
  ): Promise<ItemInterno[]> {
    const qb = this.bautismoRepository.createQueryBuilder('b');

    if (nombre) {
      qb.andWhere(
        new Brackets((builder) =>
          builder
            .where('b."Nombre" ILIKE :nombre', { nombre: `%${nombre}%` })
            .orWhere('b."PrimerApellido" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            })
            .orWhere('b."SegundoApellido" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            }),
        ),
      );
    }

    // La cédula se guarda como entero; se compara de forma exacta (sin coincidencias parciales).
    if (cedula) {
      const numerica = Number(cedula.replace(/-/g, ''));
      if (Number.isInteger(numerica)) {
        qb.andWhere('b."Cedula" = :cedula', { cedula: numerica });
      } else {
        return [];
      }
    }

    const registros = await qb.getMany();
    return registros.map((b) => {
      const fechaISO = b.fechaBautismo
        ? this.fechaISODeDate(b.fechaBautismo)
        : null;
      return {
        fechaISO,
        dto: {
          id: b.id,
          tipo: 'Bautismo' as TipoSacramento,
          nombre:
            `${b.nombre} ${b.primerApellido} ${b.segundoApellido}`.trim() ||
            'Sin nombre',
          cedula: b.cedula ? this.formatearCedula(b.cedula) : '',
          fechaCelebracion: fechaISO ? this.isoADate(fechaISO) : '',
          lugar: b.nombreParroquia,
          detalles: { ...b },
        },
      };
    });
  }

  private async buscarComuniones(nombre?: string): Promise<ItemInterno[]> {
    const qb = this.comunionRepository.createQueryBuilder('c');

    if (nombre) {
      qb.andWhere('c."Nombre" ILIKE :nombre', { nombre: `%${nombre}%` });
    }

    const registros = await qb.getMany();
    return registros.map((c) => {
      const fechaISO = fechaISODesdePartes(
        c.diaComunion,
        c.mesComunion,
        c.annioComunion,
      );
      return {
        fechaISO,
        dto: {
          id: c.id,
          tipo: 'Comunion' as TipoSacramento,
          nombre: c.nombre || 'Sin nombre',
          cedula: '',
          fechaCelebracion: fechaISO ? this.isoADate(fechaISO) : '',
          lugar: c.lugarComunion,
          detalles: { ...c },
        },
      };
    });
  }

  private async buscarConfirmaciones(nombre?: string): Promise<ItemInterno[]> {
    const qb = this.confirmacionRepository.createQueryBuilder('cf');

    if (nombre) {
      qb.andWhere('cf."Nombre" ILIKE :nombre', { nombre: `%${nombre}%` });
    }

    const registros = await qb.getMany();
    return registros.map((cf) => {
      const fechaISO = fechaISODesdePartes(
        cf.diaConfirmacion,
        cf.mesConfirmacion,
        cf.annioConfirmacion,
      );
      return {
        fechaISO,
        dto: {
          id: cf.id,
          tipo: 'Confirmacion' as TipoSacramento,
          nombre: cf.nombre || 'Sin nombre',
          cedula: '',
          fechaCelebracion: fechaISO ? this.isoADate(fechaISO) : '',
          lugar: cf.lugarConfirmacion,
          detalles: { ...cf },
        },
      };
    });
  }

  private async buscarMatrimonios(nombre?: string): Promise<ItemInterno[]> {
    const qb = this.matrimonioRepository.createQueryBuilder('m');

    if (nombre) {
      qb.andWhere(
        new Brackets((builder) =>
          builder
            .where('m."NombreContrayente" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            })
            .orWhere('m."NombreContrayente2" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            }),
        ),
      );
    }

    const registros = await qb.getMany();
    return registros.map((m) => {
      const fechaISO = fechaISODesdePartes(
        m.diaMatrimonio,
        m.mesMatrimonio,
        m.annioMatrimonio,
      );
      return {
        fechaISO,
        dto: {
          id: m.id,
          tipo: 'Matrimonio' as TipoSacramento,
          nombre:
            `${m.nombreContrayente} y ${m.nombreContrayente2}`.trim() ||
            'Sin nombre',
          cedula: '',
          fechaCelebracion: fechaISO ? this.isoADate(fechaISO) : '',
          lugar: m.lugarMatrimonio,
          detalles: { ...m },
        },
      };
    });
  }

  private fechaISODeDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private buscarComunionesVacio(): ItemInterno[] {
    return [];
  }

  private buscarConfirmacionesVacio(): ItemInterno[] {
    return [];
  }

  private buscarMatrimoniosVacio(): ItemInterno[] {
    return [];
  }

  private isoADate(iso: string): string {
    const [anio, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private formatearCedula(valor: number): string {
    const s = String(valor).padStart(9, '0');
    return `${s[0]}-${s.slice(1, 5)}-${s.slice(5)}`;
  }
}