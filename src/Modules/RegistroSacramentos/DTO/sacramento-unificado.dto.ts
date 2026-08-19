export type TipoSacramento =
  'Bautismo' | 'Comunion' | 'Confirmacion' | 'Matrimonio';

/** Item unificado devuelto por la búsqueda. Alineado a la forma que arma el frontend. */
export class SacramentoUnificadoDto {
  id: number;
  tipo: TipoSacramento;
  nombre: string;
  cedula: string;
  fechaCelebracion: string;
  lugar: string;
  detalles: Record<string, unknown>;
}

export class PaginadoSacramentosDto {
  items: SacramentoUnificadoDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
