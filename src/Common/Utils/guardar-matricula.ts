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
      if (
        detalle.code === '23505' &&
        esIndiceCedulaPendiente(detalle.constraint, indice)
      ) {
        throw new ConflictException({
          mensaje:
            'Ya existe una solicitud pendiente con esta cédula en este módulo.',
        });
      }
    }
    throw error; // no esconder caídas de BD como si fueran duplicados
  }
}

// El nombre exacto del índice puede variar (p. ej. si lo creó synchronize antes),
// así que además del nombre pedido se acepta cualquier índice de cédula pendiente.
function esIndiceCedulaPendiente(
  constraint: string | undefined,
  indice: string,
): boolean {
  if (!constraint) return false;
  const valor = constraint.toLowerCase();
  if (valor === indice.toLowerCase()) return true;
  return valor.includes('cedula') && valor.includes('pendiente');
}
