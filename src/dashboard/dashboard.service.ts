import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesis } from '../Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { SolicSacramento } from '../Modules/Solicitudes/Entities/solic-sacramento.entity';
import { SacramentoRegistro } from '../Modules/RegistroSacramentos/Entities/sacramento-registro.entity';
import { Donacion } from '../Modules/Donaciones/Entities/donacion.entity';
import { Evento } from '../Modules/Eventos/Entities/evento.entity';
import { Usuario } from '../Users/Entities/usuario.entity';

export interface DashboardStats {
  solicitudesCatequesis: number;
  solicitudesConstancias: number;
  registrosSacramentos: number;
  donaciones: number;
  eventos: number;
  usuarios: number;
}

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
    ] = await Promise.all([
      this.inscripcionCatequesisRepository.count(),
      this.solicSacramentoRepository.count(),
      this.sacramentoRepository.count(),
      this.donacionRepository.count(),
      this.eventoRepository.count(),
      this.usuarioRepository.count(),
    ]);

    return {
      solicitudesCatequesis,
      solicitudesConstancias,
      registrosSacramentos,
      donaciones,
      eventos,
      usuarios,
    };
  }
}
