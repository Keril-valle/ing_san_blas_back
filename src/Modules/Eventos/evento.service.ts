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
    const {
      publicado: _publicado,
      activo: _activo,
      ...datos
    } = createEventoDto;
    const evento = this.eventoRepository.create({
      ...datos,
      fechaInicio:
        this.soloFecha(createEventoDto.fechaInicio) ??
        createEventoDto.fechaInicio,
      fechaFin: this.soloFecha(createEventoDto.fechaFin),
      hora: this.soloHora(createEventoDto.hora),
      imagenUrl: this.soloTexto(createEventoDto.imagenUrl),
<<<<<<< HEAD
      estado: EstadoEvento.BORRADOR,
=======
      estado: 'borrador',
>>>>>>> 80f1ce2 (e)
    });
    return this.eventoRepository.save(evento);
  }

  findAll() {
    return this.eventoRepository.find();
  }

  findPublicos() {
    return this.eventoRepository.find({
<<<<<<< HEAD
      where: { estado: EstadoEvento.PUBLICADO },
=======
      where: { estado: 'publicado' },
>>>>>>> 80f1ce2 (e)
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
<<<<<<< HEAD
    const { eliminarImagen, ...datos } = updateEventoDto;
    this.validarFechas(
      datos.fechaInicio ?? evento.fechaInicio,
      datos.fechaFin === undefined ? evento.fechaFin : datos.fechaFin,
    );
=======
    const {
      publicado: _publicado,
      activo: _activo,
      eliminarImagen,
      ...datos
    } = updateEventoDto;
    const fechaInicio = datos.fechaInicio ?? evento.fechaInicio;
    const fechaFin =
      datos.fechaFin === undefined ? evento.fechaFin : datos.fechaFin;
    this.validarFechas(fechaInicio, fechaFin, {
      inicioOriginal: evento.fechaInicio,
      finOriginal: evento.fechaFin,
    });
>>>>>>> 80f1ce2 (e)
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

<<<<<<< HEAD
    if (evento.estado !== EstadoEvento.BORRADOR) {
=======
    if (evento.estado !== 'borrador') {
>>>>>>> 80f1ce2 (e)
      throw new BadRequestException('Este evento ya fue publicado.');
    }

    this.validarFechas(evento.fechaInicio, evento.fechaFin);

<<<<<<< HEAD
    evento.estado = EstadoEvento.PUBLICADO;
=======
    evento.estado = 'publicado';
>>>>>>> 80f1ce2 (e)
    return this.eventoRepository.save(evento);
  }

  async activar(id: number) {
    const evento = await this.findOne(id);

<<<<<<< HEAD
    if (evento.estado === EstadoEvento.BORRADOR) {
=======
    if (evento.estado === 'borrador') {
>>>>>>> 80f1ce2 (e)
      throw new BadRequestException(
        'Solo se pueden activar eventos publicados.',
      );
    }

<<<<<<< HEAD
    if (evento.estado === EstadoEvento.PUBLICADO) {
      throw new BadRequestException('Este evento ya está activo.');
    }

    evento.estado = EstadoEvento.PUBLICADO;
=======
    if (evento.estado === 'publicado') {
      throw new BadRequestException('Este evento ya está activo.');
    }

    evento.estado = 'publicado';
>>>>>>> 80f1ce2 (e)
    return this.eventoRepository.save(evento);
  }

  async desactivar(id: number) {
    const evento = await this.findOne(id);

<<<<<<< HEAD
    if (evento.estado === EstadoEvento.BORRADOR) {
=======
    if (evento.estado === 'borrador') {
>>>>>>> 80f1ce2 (e)
      throw new BadRequestException(
        'Solo se pueden desactivar eventos publicados.',
      );
    }

<<<<<<< HEAD
    if (evento.estado === EstadoEvento.DESACTIVADO) {
      throw new BadRequestException('Este evento ya está inactivo.');
    }

    evento.estado = EstadoEvento.DESACTIVADO;
=======
    if (evento.estado === 'desactivado') {
      throw new BadRequestException('Este evento ya está inactivo.');
    }

    evento.estado = 'desactivado';
>>>>>>> 80f1ce2 (e)
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

  private validarFechas(
    fechaInicio?: string,
    fechaFin?: string | null,
    originales?: { inicioOriginal?: string | null; finOriginal?: string | null },
  ) {
    const hoy = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Costa_Rica',
    });
    const inicio = this.soloFecha(fechaInicio);
    const fin = this.soloFecha(fechaFin);
    const inicioOriginal = this.soloFecha(originales?.inicioOriginal);
    const finOriginal = this.soloFecha(originales?.finOriginal);

    if (inicio && inicio < hoy && inicio !== inicioOriginal) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser anterior a la fecha actual.',
      );
    }

    if (fin && fin < hoy && fin !== finOriginal) {
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
