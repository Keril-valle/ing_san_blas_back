import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionCatequesis } from '../Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { SolicSacramento } from '../Modules/Solicitudes/Entities/solic-sacramento.entity';
import { Bautismo } from '../Modules/RegistroSacramentos/Entities/bautismo.entity';
import { Comunion } from '../Modules/RegistroSacramentos/Entities/comunion.entity';
import { Confirmacion } from '../Modules/RegistroSacramentos/Entities/confirmacion.entity';
import { Matrimonio } from '../Modules/RegistroSacramentos/Entities/matrimonio.entity';
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
    @InjectRepository(Bautismo)
    private readonly bautismoRepository: Repository<Bautismo>,
    @InjectRepository(Comunion)
    private readonly comunionRepository: Repository<Comunion>,
    @InjectRepository(Confirmacion)
    private readonly confirmacionRepository: Repository<Confirmacion>,
    @InjectRepository(Matrimonio)
    private readonly matrimonioRepository: Repository<Matrimonio>,
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
      bautismos,
      comuniones,
      confirmaciones,
      matrimonios,
      donaciones,
      eventos,
      usuarios,
    ] = await Promise.all([
      this.inscripcionCatequesisRepository.count(),
      this.solicSacramentoRepository.count(),
      this.bautismoRepository.count(),
      this.comunionRepository.count(),
      this.confirmacionRepository.count(),
      this.matrimonioRepository.count(),
      this.donacionRepository.count(),
      this.eventoRepository.count(),
      this.usuarioRepository.count(),
    ]);

    return {
      solicitudesCatequesis,
      solicitudesConstancias,
      registrosSacramentos:
        bautismos + comuniones + confirmaciones + matrimonios,
      donaciones,
      eventos,
      usuarios,
    };
  }
}
