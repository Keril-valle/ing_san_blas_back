import { PartialType } from '@nestjs/mapped-types';
import { CreateSacramentoDto } from './create-sacramento.dto';

export class UpdateSacramentoDto extends PartialType(CreateSacramentoDto) {}
