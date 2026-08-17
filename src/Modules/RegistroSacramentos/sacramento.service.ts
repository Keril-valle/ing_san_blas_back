import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Sacramento } from './Entities/sacramento.entity';
import { SearchSacramentoDto } from './DTO/search-sacramento.dto';
import { SacramentoResponseDto } from './DTO/sacramento-response.dto';

@Injectable()
export class SacramentoService {
  constructor(
    @InjectRepository(Sacramento)
    private readonly sacramentoRepository: Repository<Sacramento>,
  ) {}

  // Busca por nombre, cédula o apellido usando coincidencias parciales.
  async search(filters: SearchSacramentoDto): Promise<SacramentoResponseDto[]> {
    const query = this.sacramentoRepository.createQueryBuilder('sacramento');
    const nombre = filters.nombre?.trim();
    const cedula = filters.cedula?.trim();
    const apellido = filters.apellido?.trim();

    if (nombre) {
      query.andWhere(
        new Brackets((builder) =>
          builder
            .where('sacramento."PrimerNombre" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            })
            .orWhere('sacramento."SegundoNombre" ILIKE :nombre', {
              nombre: `%${nombre}%`,
            }),
        ),
      );
    }

    if (cedula) {
      query.andWhere('sacramento."Cedula" ILIKE :cedula', {
        cedula: `%${cedula}%`,
      });
    }

    if (apellido) {
      query.andWhere(
        new Brackets((builder) =>
          builder
            .where('sacramento."PrimerApellido" ILIKE :apellido', {
              apellido: `%${apellido}%`,
            })
            .orWhere('sacramento."SegundoApellido" ILIKE :apellido', {
              apellido: `%${apellido}%`,
            }),
        ),
      );
    }

    const records = await query.getMany();
    return records.map((record) => this.toDto(record));
  }

  // Convierte la entidad para no exponer directamente el modelo de persistencia.
  private toDto(record: Sacramento): SacramentoResponseDto {
    return {
      id: record.id,
      cedula: record.cedula,
      primerNombre: record.primerNombre,
      segundoNombre: record.segundoNombre,
      primerApellido: record.primerApellido,
      segundoApellido: record.segundoApellido,
      libro: record.libro,
      folio: record.folio,
      asiento: record.asiento,
    };
  }
}
