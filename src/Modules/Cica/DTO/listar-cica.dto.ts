import { IsIn, IsOptional } from 'class-validator';
import { ListarMatriculasDto } from '../../../Common/DTO/listar-matriculas.dto';

export class ListarCicaDto extends ListarMatriculasDto {
  @IsOptional()
  @IsIn(['bautizo', 'primeraComunion', 'confirmacion'])
  sacramento?: 'bautizo' | 'primeraComunion' | 'confirmacion';
}
