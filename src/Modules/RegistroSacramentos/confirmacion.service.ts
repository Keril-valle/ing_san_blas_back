import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Confirmacion } from './Entities/confirmacion.entity';
import { ConfirmacionDto } from './DTO/sacramento.dto';
import { ConfirmacionInput } from '../../Common/Utils/sacramento-input-normalizer';

@Injectable()
export class ConfirmacionService {
  constructor(
    @InjectRepository(Confirmacion)
    private readonly confirmacionRepository: Repository<Confirmacion>,
  ) {}

  async findAll(): Promise<ConfirmacionDto[]> {
    const records = await this.confirmacionRepository.find();
    return records.map((record) => this.toDto(record));
  }

  async findById(id: number): Promise<ConfirmacionDto | null> {
    const record = await this.confirmacionRepository.findOne({ where: { id } });
    return record ? this.toDto(record) : null;
  }

  async create(input: ConfirmacionInput): Promise<ConfirmacionDto> {
    const record = this.confirmacionRepository.create({
      nombre: input.nombre,
      diaConfirmacion: input.diaConfirmacion,
      mesConfirmacion: input.mesConfirmacion,
      annioConfirmacion: input.annioConfirmacion,
      lugarConfirmacion: input.lugarConfirmacion,
    });
    const saved = await this.confirmacionRepository.save(record);
    return this.toDto(saved);
  }

  async update(
    id: number,
    input: ConfirmacionInput,
  ): Promise<ConfirmacionDto | null> {
    if (id !== input.id) {
      return null;
    }

    const record = await this.confirmacionRepository.findOne({ where: { id } });
    if (!record) {
      return null;
    }

    Object.assign(record, {
      nombre: input.nombre,
      diaConfirmacion: input.diaConfirmacion,
      mesConfirmacion: input.mesConfirmacion,
      annioConfirmacion: input.annioConfirmacion,
      lugarConfirmacion: input.lugarConfirmacion,
    });

    const saved = await this.confirmacionRepository.save(record);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.confirmacionRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDto(record: Confirmacion): ConfirmacionDto {
    return {
      id: record.id,
      nombre: record.nombre,
      diaConfirmacion: record.diaConfirmacion,
      mesConfirmacion: record.mesConfirmacion,
      annioConfirmacion: record.annioConfirmacion,
      lugarConfirmacion: record.lugarConfirmacion,
    };
  }
}
