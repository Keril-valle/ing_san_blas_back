import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { ObjectLiteral, Repository } from 'typeorm';

// El índice parcial es la autoridad: también cubre dos envíos al mismo tiempo.
export async function guardarMatricula<T extends ObjectLiteral>(
  repositorio: Repository<T>,
  entidad: T,
  indice: string,
): Promise<T> {
  try {
    return await repositorio.save(entidad);
  } catch (error) {
    if (error instanceof QueryFailedError) {
      const detalle = error.driverError as {
        code?: string;
        constraint?: string;
      };
      if (detalle.code === '23505' && detalle.constraint === indice) {
        throw new ConflictException({
          mensaje:
            'Ya existe una solicitud pendiente con esta cédula en este módulo.',
        });
      }
    }
    throw error; // no esconder caídas de BD como si fueran duplicados
  }
}
