import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bautismo } from './Entities/bautismo.entity';
import { BautismoDto } from './DTO/sacramento.dto';
import {
  BautismoInput,
  formatDateOnly,
  formatHoraNacimiento,
  parseUtcDate,
  toIntervalString,
} from '../../Common/Utils/sacramento-input-normalizer';

@Injectable()
export class BautismoService {
  constructor(
    @InjectRepository(Bautismo)
    private readonly bautismoRepository: Repository<Bautismo>,
  ) {}

  async findAll(): Promise<BautismoDto[]> {
    const records = await this.bautismoRepository.find();
    return records.map((record) => this.toDto(record));
  }

  async findById(id: number): Promise<BautismoDto | null> {
    const record = await this.bautismoRepository.findOne({ where: { id } });
    return record ? this.toDto(record) : null;
  }

  async create(input: BautismoInput): Promise<BautismoDto> {
    const record = this.bautismoRepository.create(this.toEntity(input));
    const saved = await this.bautismoRepository.save(record);
    return this.toDto(saved);
  }

  async update(id: number, input: BautismoInput): Promise<BautismoDto | null> {
    if (id !== input.id) {
      return null;
    }

    const record = await this.bautismoRepository.findOne({ where: { id } });
    if (!record) {
      return null;
    }

    Object.assign(record, this.toEntity(input));
    const saved = await this.bautismoRepository.save(record);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.bautismoRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toEntity(input: BautismoInput): Partial<Bautismo> {
    return {
      nombre: input.nombre,
      cedula: input.cedula,
      primerApellido: input.primerApellido,
      segundoApellido: input.segundoApellido,
      nombreParroquia: input.nombreParroquia,
      fechaBautismo: parseUtcDate(input.fechaBautismo),
      annioBautismo: input.annioBautismo,
      prebispero: input.prebispero,
      fechaNacimiento: parseUtcDate(input.fechaNacimiento),
      horaNacimiento: toIntervalString(input.horaNacimiento),
      nombreAbuelosPaternos: input.nombreAbuelosPaternos,
      nombreAbuelosMaternos: input.nombreAbuelosMaternos,
    };
  }

  private toDto(record: Bautismo): BautismoDto {
    return {
      id: record.id,
      nombre: record.nombre,
      cedula: record.cedula,
      primerApellido: record.primerApellido,
      segundoApellido: record.segundoApellido,
      nombreParroquia: record.nombreParroquia,
      fechaBautismo: formatDateOnly(record.fechaBautismo),
      annioBautismo: record.annioBautismo,
      prebispero: record.prebispero,
      fechaNacimiento: formatDateOnly(record.fechaNacimiento),
      horaNacimiento: formatHoraNacimiento(record.horaNacimiento),
      nombreAbuelosPaternos: record.nombreAbuelosPaternos,
      nombreAbuelosMaternos: record.nombreAbuelosMaternos,
    };
  }
}
