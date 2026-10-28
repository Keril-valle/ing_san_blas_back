import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, Matches } from 'class-validator';

// «Todos» no es un estado guardado: significa que no se agrega ese filtro.
export const limpiarFiltroExportacion = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.trim() === 'todos' || value.trim() === ''
      ? undefined
      : value.trim()
    : value;

export class ExportarMatriculasDto {
  @IsOptional()
  @Transform(limpiarFiltroExportacion)
  @IsIn(['Pendiente', 'Aprobada', 'Rechazada'])
  estado?: 'Pendiente' | 'Aprobada' | 'Rechazada';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  desde?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  hasta?: string;
}
