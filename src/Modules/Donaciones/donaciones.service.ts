import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donacion } from './Entities/donacion.entity';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import { DonacionResponseDto } from './DTO/donacion-response.dto';
import { normalizeDonacionEstado } from '../../Common/Utils/donacion-estado';

@Injectable()
export class DonacionesService {

  constructor(
    @InjectRepository(Donacion)
    private readonly donacionesRepository: Repository<Donacion>,
  ) {}

  private toResponseDto(donacion: Donacion): DonacionResponseDto {
    return {
      id: donacion.id,
      fecha: donacion.fecha,
      anonimo: donacion.anonimo,
      nombre: donacion.nombre,
      correo: donacion.correo,
      telefono: donacion.telefono,
      detalle: donacion.detalle,
      estado: donacion.estado,
    };
  }

  async findAll(): Promise<DonacionResponseDto[]> {
    const donaciones = await this.donacionesRepository.find({
      order: { fecha: 'DESC' },
    });
    return donaciones.map((donacion) => this.toResponseDto(donacion));
  }

  async findById(id: number): Promise<DonacionResponseDto | null> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    return donacion ? this.toResponseDto(donacion) : null;
  }

  async create(dto: CreateDonacionDto): Promise<DonacionResponseDto> {
    const donacion = this.donacionesRepository.create({
      fecha: new Date(),
      anonimo: dto.anonimo,
      nombre: dto.nombre.trim(),
      correo: dto.correo.trim(),
      telefono: dto.telefono?.trim() || null,
      detalle: dto.detalle.trim(),
      estado: 'Pendiente',
    });

    const saved = await this.donacionesRepository.save(donacion);
    return this.toResponseDto(saved);
  }

  async updateEstado(
    id: number,
    nuevoEstado: string,
  ): Promise<DonacionResponseDto> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    if (!donacion) {
      throw new NotFoundException();
    }

    donacion.estado = normalizeDonacionEstado(nuevoEstado);
    const saved = await this.donacionesRepository.save(donacion);

    return this.toResponseDto(saved);
  }
}
