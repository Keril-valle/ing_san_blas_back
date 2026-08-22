import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { BuscarSacramentosNormalizadosDto } from './DTO/buscar-sacramentos-normalizados.dto';
import {
  CreateSacramentoNormalizadoDto,
  UpdateSacramentoNormalizadoDto,
} from './DTO/create-sacramento-normalizado.dto';
import { BusquedaNormalizadaService } from './busqueda-normalizada.service';

@Controller('Sacramentos-nuevos')
@Roles(Role.ADMIN)
export class BusquedaNormalizadaController {
  constructor(private readonly busquedaService: BusquedaNormalizadaService) {}

  // Endpoint de consulta del modelo normalizado, separado durante la transición.
  @Get('buscar')
  buscar(@Query() filtros: BuscarSacramentosNormalizadosDto) {
    return this.busquedaService.buscar(filtros);
  }

  // Registra un sacramento y su detalle específico de forma atómica.
  @Post()
  crear(@Body() dto: CreateSacramentoNormalizadoDto) {
    return this.busquedaService.crear(dto);
  }

  // Obtiene el registro padre junto con el detalle de su tipo.
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.busquedaService.obtener(id);
  }

  // Actualiza el registro sin permitir cambiar su tipo sacramental.
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSacramentoNormalizadoDto,
  ) {
    return this.busquedaService.actualizar(id, dto);
  }

  // Elimina el registro padre y su detalle mediante la cascada de la base.
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.busquedaService.eliminar(id);
  }
}
