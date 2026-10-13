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
import { CatequesisBautismoService } from './catequesis-bautismo.service';
import {
  ActualizarEstadoCatequesisBautismoDto,
  CrearInscripcionCatequesisBautismoDto,
} from './DTO/inscripcion-catequesis-bautismo.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('catequesis-bautismo')
export class CatequesisBautismoController {
  constructor(private readonly servicio: CatequesisBautismoService) {}

  @Public()
  @Post()
  crear(@Body() dto: CrearInscripcionCatequesisBautismoDto) {
    return this.servicio.crear(dto);
  }

  @Get()
  @Permisos('catequesis')
  listar(@Query('vista') vista?: string, @Query('estado') estado?: string) {
    const grupo = vista === 'historial' ? 'historial' : 'solicitudes';
    return this.servicio.listar(grupo, estado);
  }

  @Public()
  @Get('consulta')
  consultar(@Query('cedula') cedula?: string) {
    return this.servicio.consultarPorCedula(cedula ?? '');
  }

  @Get(':id')
  @Permisos('catequesis')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }

  @Put(':id/estado')
  @Permisos('catequesis')
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoCatequesisBautismoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.servicio.actualizarEstado(id, dto, req.user?.sub);
  }
}
