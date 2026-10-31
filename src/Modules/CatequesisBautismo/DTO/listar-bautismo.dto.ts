import { IsIn, IsOptional } from 'class-validator';
import { ListarMatriculasDto } from '../../../Common/DTO/listar-matriculas.dto';
import { CONDICIONES_BAUTISMO } from './inscripcion-catequesis-bautismo.dto';

export class ListarBautismoDto extends ListarMatriculasDto {
  @IsOptional()
  @IsIn(CONDICIONES_BAUTISMO)
  condicion?: string;
}
