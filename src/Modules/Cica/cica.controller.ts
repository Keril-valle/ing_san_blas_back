import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { CicaService } from './cica.service';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
} from './DTO/inscripcion-cica.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('cica')
export class CicaController {
  constructor(private readonly cicaService: CicaService) {}

  @Public()
  @Post()
  crear(@Body() dto: CrearInscripcionCicaDto) {
    return this.cicaService.crear(dto);
  }

  @Get()
  @Permisos('catequesis')
  listar(
    @Query('vista') vista?: string,
    @Query('estado') estado?: string,
  ) {
    const grupo = vista === 'historial' ? 'historial' : 'solicitudes';
    return this.cicaService.listar(grupo, estado);
  }

  @Public()
  @Get('consulta')
  consultar(@Query('cedula') cedula?: string) {
    return this.cicaService.consultarPorCedula(cedula ?? '');
  }

  @Get(':id')
  @Permisos('catequesis')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.cicaService.obtener(id);
  }

  @Put(':id/estado')
  @Permisos('catequesis')
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoCicaDto,
    @Req() req: RequestWithUser,
  ) {
    return this.cicaService.actualizarEstado(id, dto, req.user?.sub);
  }
}
