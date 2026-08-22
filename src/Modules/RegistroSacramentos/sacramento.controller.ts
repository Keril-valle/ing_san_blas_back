import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { SacramentoService } from './sacramento.service';
import { SearchSacramentoDto } from './DTO/search-sacramento.dto';
import { Public } from '../../Auth/Decorators/public.decorator';

// http://localhost:3000/sacramento/
@Controller('sacramento')
export class SacramentoController {
  constructor(private readonly sacramentoService: SacramentoService) {}

  // Busca registros usando cualquiera de los filtros permitidos.
  //
  @Public()
  @Get('buscar')
  @HttpCode(HttpStatus.OK)
  async search(@Query() filters: SearchSacramentoDto) {
    if (
      !filters.nombre?.trim() &&
      !filters.cedula?.trim() &&
      !filters.apellido?.trim()
    ) {
      throw new BadRequestException(
        'Debe enviar al menos uno de estos filtros: nombre, cedula o apellido',
      );
    }

    const records = await this.sacramentoService.search(filters);
    if (records.length === 0) {
      throw new NotFoundException(
        'No se encontraron sacramentos con los filtros indicados',
      );
    }

    return records;
  }
}
