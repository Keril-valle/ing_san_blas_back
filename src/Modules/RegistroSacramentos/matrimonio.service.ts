import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Matrimonio } from './Entities/matrimonio.entity';
import { MatrimonioDto } from './DTO/sacramento.dto';
import { MatrimonioInput } from '../../Common/Utils/sacramento-input-normalizer';

@Injectable()
export class MatrimonioService {
  constructor(
    @InjectRepository(Matrimonio)
    private readonly matrimonioRepository: Repository<Matrimonio>,
  ) {}

  async findAll(): Promise<MatrimonioDto[]> {
    const records = await this.matrimonioRepository.find();
    return records.map((record) => this.toDto(record));
  }

  async findById(id: number): Promise<MatrimonioDto | null> {
    const record = await this.matrimonioRepository.findOne({ where: { id } });
    return record ? this.toDto(record) : null;
  }

  async create(input: MatrimonioInput): Promise<MatrimonioDto> {
    const record = this.matrimonioRepository.create({
      nombreContrayente: input.nombreContrayente,
      nombreContrayente2: input.nombreContrayente2,
      diaMatrimonio: input.diaMatrimonio,
      mesMatrimonio: input.mesMatrimonio,
      annioMatrimonio: input.annioMatrimonio,
      lugarMatrimonio: input.lugarMatrimonio,
      tomo: input.tomo,
      folio: input.folio,
    });
    const saved = await this.matrimonioRepository.save(record);
    return this.toDto(saved);
  }

  async update(id: number, input: MatrimonioInput): Promise<MatrimonioDto | null> {
    if (id !== input.id) {
      return null;
    }

    const record = await this.matrimonioRepository.findOne({ where: { id } });
    if (!record) {
      return null;
    }

    Object.assign(record, {
      nombreContrayente: input.nombreContrayente,
      nombreContrayente2: input.nombreContrayente2,
      diaMatrimonio: input.diaMatrimonio,
      mesMatrimonio: input.mesMatrimonio,
      annioMatrimonio: input.annioMatrimonio,
      lugarMatrimonio: input.lugarMatrimonio,
      tomo: input.tomo,
      folio: input.folio,
    });

    const saved = await this.matrimonioRepository.save(record);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.matrimonioRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDto(record: Matrimonio): MatrimonioDto {
    return {
      id: record.id,
      nombreContrayente: record.nombreContrayente,
      nombreContrayente2: record.nombreContrayente2,
      diaMatrimonio: record.diaMatrimonio,
      mesMatrimonio: record.mesMatrimonio,
      annioMatrimonio: record.annioMatrimonio,
      lugarMatrimonio: record.lugarMatrimonio,
      tomo: record.tomo,
      folio: record.folio,
    };
  }
}
