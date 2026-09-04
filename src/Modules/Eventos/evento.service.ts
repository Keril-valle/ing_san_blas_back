import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './Entities/evento.entity';
import { CreateEventoDto } from './DTO/create-evento.dto';
import { UpdateEventoDto } from './DTO/update-evento.dto';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  create(createEventoDto: CreateEventoDto) {
    this.validarFechas(createEventoDto.fechaInicio, createEventoDto.fechaFin);
    const evento = this.eventoRepository.create({
      ...createEventoDto,
      publicado: false,
      activo: true,
    });
    return this.eventoRepository.save(evento);
  }

  findAll() {
    return this.eventoRepository.find();
  }

  findPublicos() {
    return this.eventoRepository.find({
      where: { publicado: true, activo: true },
    });
  }

  async findOne(id: number) {
    const evento = await this.eventoRepository.findOneBy({ id });
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }
    return evento;
  }

  async update(id: number, updateEventoDto: UpdateEventoDto) {
    const evento = await this.findOne(id);
    const {
      publicado: _publicado,
      activo: _activo,
      ...datos
    } = updateEventoDto;
    this.validarFechas(
      datos.fechaInicio ?? evento.fechaInicio,
      datos.fechaFin === undefined ? evento.fechaFin : datos.fechaFin,
    );
    Object.assign(evento, datos);
    return this.eventoRepository.save(evento);
  }

  async publicar(id: number) {
    const evento = await this.findOne(id);

    if (evento.publicado) {
      throw new BadRequestException('Este evento ya fue publicado.');
    }

    this.validarFechas(evento.fechaInicio, evento.fechaFin);

    evento.publicado = true;
    evento.activo = true;
    return this.eventoRepository.save(evento);
  }

  async activar(id: number) {
    const evento = await this.findOne(id);

    if (!evento.publicado) {
      throw new BadRequestException(
        'Solo se pueden activar eventos publicados.',
      );
    }

    if (evento.activo) {
      throw new BadRequestException('Este evento ya está activo.');
    }

    evento.activo = true;
    return this.eventoRepository.save(evento);
  }

  async desactivar(id: number) {
    const evento = await this.findOne(id);

    if (!evento.publicado) {
      throw new BadRequestException(
        'Solo se pueden desactivar eventos publicados.',
      );
    }

    if (!evento.activo) {
      throw new BadRequestException('Este evento ya está inactivo.');
    }

    evento.activo = false;
    return this.eventoRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.findOne(id);
    return this.eventoRepository.remove(evento);
  }

  private validarFechas(fechaInicio?: string, fechaFin?: string | null) {
    const hoy = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Costa_Rica',
    });
    const inicio = fechaInicio?.slice(0, 10);
    const fin = fechaFin?.slice(0, 10);

    if (inicio && inicio < hoy) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser anterior a la fecha actual.',
      );
    }

    if (fin && fin < hoy) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha actual.',
      );
    }

    if (inicio && fin && fin < inicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio.',
      );
    }
  }
}
