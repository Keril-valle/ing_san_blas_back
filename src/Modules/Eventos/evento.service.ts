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
import { EventoFileStorageService } from './evento-file-storage.service';
import { EstadoEvento } from '../../Common/Enums/EstadoEvento';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    private readonly fileStorageService: EventoFileStorageService,
  ) {}

  async createWithImage(
    createEventoDto: CreateEventoDto,
    archivo?: Express.Multer.File,
  ) {
    if (archivo) {
      createEventoDto.imagenUrl =
        await this.fileStorageService.saveEventoImage(archivo);
    }
    return this.create(createEventoDto);
  }

  async updateWithImage(
    id: number,
    updateEventoDto: UpdateEventoDto,
    archivo?: Express.Multer.File,
  ) {
    if (archivo) {
      updateEventoDto.imagenUrl =
        await this.fileStorageService.saveEventoImage(archivo);
      updateEventoDto.eliminarImagen = false;
    }
    return this.update(id, updateEventoDto);
  }

  create(createEventoDto: CreateEventoDto) {
    this.validarFechas(createEventoDto.fechaInicio, createEventoDto.fechaFin);
    const evento = this.eventoRepository.create({
      ...createEventoDto,
      fechaInicio:
        this.soloFecha(createEventoDto.fechaInicio) ??
        createEventoDto.fechaInicio,
      fechaFin: this.soloFecha(createEventoDto.fechaFin),
      hora: this.soloHora(createEventoDto.hora),
      imagenUrl: this.soloTexto(createEventoDto.imagenUrl),
      estado: EstadoEvento.BORRADOR,
    });
    return this.eventoRepository.save(evento);
  }

  findAll() {
    return this.eventoRepository.find();
  }

  findPublicos() {
    return this.eventoRepository.find({
      where: { estado: EstadoEvento.PUBLICADO },
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
    const { eliminarImagen, ...datos } = updateEventoDto;
    this.validarFechas(
      datos.fechaInicio ?? evento.fechaInicio,
      datos.fechaFin === undefined ? evento.fechaFin : datos.fechaFin,
    );
    Object.assign(evento, datos, {
      fechaInicio:
        datos.fechaInicio === undefined
          ? evento.fechaInicio
          : (this.soloFecha(datos.fechaInicio) ?? evento.fechaInicio),
      fechaFin:
        datos.fechaFin === undefined
          ? evento.fechaFin
          : this.soloFecha(datos.fechaFin),
      hora: datos.hora === undefined ? evento.hora : this.soloHora(datos.hora),
      imagenUrl: eliminarImagen
        ? null
        : datos.imagenUrl === undefined
          ? evento.imagenUrl
          : this.soloTexto(datos.imagenUrl),
    });
    return this.eventoRepository.save(evento);
  }

  async publicar(id: number) {
    const evento = await this.findOne(id);

    if (evento.estado !== EstadoEvento.BORRADOR) {
      throw new BadRequestException('Este evento ya fue publicado.');
    }

    this.validarFechas(evento.fechaInicio, evento.fechaFin);

    evento.estado = EstadoEvento.PUBLICADO;
    return this.eventoRepository.save(evento);
  }

  async activar(id: number) {
    const evento = await this.findOne(id);

    if (evento.estado === EstadoEvento.BORRADOR) {
      throw new BadRequestException(
        'Solo se pueden activar eventos publicados.',
      );
    }

    if (evento.estado === EstadoEvento.PUBLICADO) {
      throw new BadRequestException('Este evento ya está activo.');
    }

    evento.estado = EstadoEvento.PUBLICADO;
    return this.eventoRepository.save(evento);
  }

  async desactivar(id: number) {
    const evento = await this.findOne(id);

    if (evento.estado === EstadoEvento.BORRADOR) {
      throw new BadRequestException(
        'Solo se pueden desactivar eventos publicados.',
      );
    }

    if (evento.estado === EstadoEvento.DESACTIVADO) {
      throw new BadRequestException('Este evento ya está inactivo.');
    }

    evento.estado = EstadoEvento.DESACTIVADO;
    return this.eventoRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.findOne(id);
    return this.eventoRepository.remove(evento);
  }

  private soloFecha(fecha?: string | null) {
    if (!fecha) return null;
    const match = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : fecha.slice(0, 10);
  }

  private soloHora(hora?: string | null) {
    if (!hora) return null;
    const match = String(hora)
      .trim()
      .match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  private soloTexto(valor?: string | null) {
    const texto = valor?.trim();
    return texto ? texto : null;
  }

  private validarFechas(fechaInicio?: string, fechaFin?: string | null) {
    const hoy = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Costa_Rica',
    });
    const inicio = this.soloFecha(fechaInicio);
    const fin = this.soloFecha(fechaFin);

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
