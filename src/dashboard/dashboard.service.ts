import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesis } from '../Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { SolicSacramento } from '../Modules/Solicitudes/Entities/solic-sacramento.entity';
import { SacramentoRegistro } from '../Modules/RegistroSacramentos/Entities/sacramento-registro.entity';
import { Donacion } from '../Modules/Donaciones/Entities/donacion.entity';
import { Evento } from '../Modules/Eventos/Entities/evento.entity';
import { Usuario } from '../Users/Entities/usuario.entity';

export interface DashboardChartSlice {
  etiqueta: string;
  total: number;
}

export interface DashboardMesActividad {
  mes: string;
  catequesis: number;
  constancias: number;
  sacramentos: number;
  donaciones: number;
}

export interface DashboardGraficos {
  catequesisPorEstado: DashboardChartSlice[];
  constanciasPorEstado: DashboardChartSlice[];
  sacramentosPorTipo: DashboardChartSlice[];
  donacionesPorEstado: DashboardChartSlice[];
  eventosPorEstado: DashboardChartSlice[];
  actividadMensual: DashboardMesActividad[];
}

export interface DashboardStats {
  solicitudesCatequesis: number;
  solicitudesConstancias: number;
  registrosSacramentos: number;
  donaciones: number;
  eventos: number;
  usuarios: number;
  graficos: DashboardGraficos;
}

type RawCountRow = { etiqueta: string | null; total: string | number };
type RawMesRow = { mes: string; total: string | number };

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(InscripcionCatequesis)
    private readonly inscripcionCatequesisRepository: Repository<InscripcionCatequesis>,
    @InjectRepository(SolicSacramento)
    private readonly solicSacramentoRepository: Repository<SolicSacramento>,
    @InjectRepository(SacramentoRegistro)
    private readonly sacramentoRepository: Repository<SacramentoRegistro>,
    @InjectRepository(Donacion)
    private readonly donacionRepository: Repository<Donacion>,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async obtenerEstadisticas(): Promise<DashboardStats> {
    const [
      solicitudesCatequesis,
      solicitudesConstancias,
      registrosSacramentos,
      donaciones,
      eventos,
      usuarios,
      catequesisPorEstado,
      constanciasPorEstado,
      sacramentosPorTipo,
      donacionesPorEstado,
      eventosPorEstado,
      actividadMensual,
    ] = await Promise.all([
      this.inscripcionCatequesisRepository.count(),
      this.solicSacramentoRepository.count(),
      this.sacramentoRepository.count(),
      this.donacionRepository.count(),
      this.eventoRepository.count(),
      this.usuarioRepository.count(),
      this.contarPorCampo(
        this.inscripcionCatequesisRepository,
        'i',
        'estado',
      ),
      this.contarPorCampo(this.solicSacramentoRepository, 's', 'Estado'),
      this.contarPorCampo(this.sacramentoRepository, 'r', 'tipo'),
      this.contarPorCampo(this.donacionRepository, 'd', 'estado'),
      this.contarPorCampo(this.eventoRepository, 'e', 'estado'),
      this.obtenerActividadMensual(6),
    ]);

    return {
      solicitudesCatequesis,
      solicitudesConstancias,
      registrosSacramentos,
      donaciones,
      eventos,
      usuarios,
      graficos: {
        catequesisPorEstado,
        constanciasPorEstado,
        sacramentosPorTipo,
        donacionesPorEstado,
        eventosPorEstado,
        actividadMensual,
      },
    };
  }

  private async contarPorCampo<T extends object>(
    repository: Repository<T>,
    alias: string,
    campo: string,
  ): Promise<DashboardChartSlice[]> {
    const rows = await repository
      .createQueryBuilder(alias)
      .select(`${alias}.${campo}`, 'etiqueta')
      .addSelect('COUNT(*)', 'total')
      .groupBy(`${alias}.${campo}`)
      .orderBy('total', 'DESC')
      .getRawMany<RawCountRow>();

    return rows.map((row) => ({
      etiqueta: row.etiqueta?.toString() || 'Sin dato',
      total: Number(row.total) || 0,
    }));
  }

  private async obtenerActividadMensual(
    meses: number,
  ): Promise<DashboardMesActividad[]> {
    const desde = new Date();
    desde.setUTCDate(1);
    desde.setUTCHours(0, 0, 0, 0);
    desde.setUTCMonth(desde.getUTCMonth() - (meses - 1));
    const desdeStr = desde.toISOString().slice(0, 10);

    const [catequesis, constancias, sacramentos, donaciones] =
      await Promise.all([
        this.inscripcionCatequesisRepository
          .createQueryBuilder('i')
          .select(
            `to_char(date_trunc('month', i."FechaSolicitud"::timestamp), 'YYYY-MM')`,
            'mes',
          )
          .addSelect('COUNT(*)', 'total')
          .where('i."FechaSolicitud" >= :desde', { desde: desdeStr })
          .groupBy('mes')
          .getRawMany<RawMesRow>(),
        this.solicSacramentoRepository
          .createQueryBuilder('s')
          .select(
            `to_char(date_trunc('month', s."FechaSolicitud"), 'YYYY-MM')`,
            'mes',
          )
          .addSelect('COUNT(*)', 'total')
          .where('s."FechaSolicitud" IS NOT NULL')
          .andWhere('s."FechaSolicitud" >= :desde', { desde })
          .groupBy('mes')
          .getRawMany<RawMesRow>(),
        this.sacramentoRepository
          .createQueryBuilder('r')
          .select(
            `to_char(date_trunc('month', r.fecha_sacramento::timestamp), 'YYYY-MM')`,
            'mes',
          )
          .addSelect('COUNT(*)', 'total')
          .where('r.fecha_sacramento >= :desde', { desde: desdeStr })
          .groupBy('mes')
          .getRawMany<RawMesRow>(),
        this.donacionRepository
          .createQueryBuilder('d')
          .select(
            `to_char(date_trunc('month', d."Fecha"), 'YYYY-MM')`,
            'mes',
          )
          .addSelect('COUNT(*)', 'total')
          .where('d."Fecha" >= :desde', { desde })
          .groupBy('mes')
          .getRawMany<RawMesRow>(),
      ]);

    const mapa = (rows: RawMesRow[]) =>
      new Map(rows.map((r) => [r.mes, Number(r.total) || 0]));

    const porCatequesis = mapa(catequesis);
    const porConstancias = mapa(constancias);
    const porSacramentos = mapa(sacramentos);
    const porDonaciones = mapa(donaciones);

    const resultado: DashboardMesActividad[] = [];
    for (let i = 0; i < meses; i++) {
      const fecha = new Date(
        Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + i, 1),
      );
      const mes = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
      resultado.push({
        mes,
        catequesis: porCatequesis.get(mes) ?? 0,
        constancias: porConstancias.get(mes) ?? 0,
        sacramentos: porSacramentos.get(mes) ?? 0,
        donaciones: porDonaciones.get(mes) ?? 0,
      });
    }

    return resultado;
  }
}
