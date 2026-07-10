import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicSacramentoDto } from './create-solic-sacramento.dto';

export class UpdateSolicSacramentoDto extends PartialType(
  CreateSolicSacramentoDto,
) {}
