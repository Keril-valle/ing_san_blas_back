import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comunion } from './Entities/comunion.entity';
import { ComunionDto } from './DTO/sacramento.dto';
import { ComunionInput } from '../../Common/Utils/sacramento-input-normalizer';

@Injectable()
export class ComunionService {
  constructor(
    @InjectRepository(Comunion)
    private readonly comunionRepository: Repository<Comunion>,
  ) {}

  async findAll(): Promise<ComunionDto[]> {
    const records = await this.comunionRepository.find();
    return records.map((record) => this.toDto(record));
  }

  async findById(id: number): Promise<ComunionDto | null> {
    const record = await this.comunionRepository.findOne({ where: { id } });
    return record ? this.toDto(record) : null;
  }

  async create(input: ComunionInput): Promise<ComunionDto> {
    const record = this.comunionRepository.create({
      nombre: input.nombre,
      diaComunion: input.diaComunion,
      mesComunion: input.mesComunion,
      annioComunion: input.annioComunion,
      lugarComunion: input.lugarComunion,
    });
    const saved = await this.comunionRepository.save(record);
    return this.toDto(saved);
  }

  async update(id: number, input: ComunionInput): Promise<ComunionDto | null> {
    if (id !== input.id) {
      return null;
    }

    const record = await this.comunionRepository.findOne({ where: { id } });
    if (!record) {
      return null;
    }

    Object.assign(record, {
      nombre: input.nombre,
      diaComunion: input.diaComunion,
      mesComunion: input.mesComunion,
      annioComunion: input.annioComunion,
      lugarComunion: input.lugarComunion,
    });

    const saved = await this.comunionRepository.save(record);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.comunionRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDto(record: Comunion): ComunionDto {
    return {
      id: record.id,
      nombre: record.nombre,
      diaComunion: record.diaComunion,
      mesComunion: record.mesComunion,
      annioComunion: record.annioComunion,
      lugarComunion: record.lugarComunion,
    };
  }
}
