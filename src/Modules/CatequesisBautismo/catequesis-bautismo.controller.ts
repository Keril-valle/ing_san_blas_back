import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CatequesisBautismoService } from './catequesis-bautismo.service';
import { BautismoExportService } from './bautismo-export.service';
import { ExportarMatriculasDto } from '../../Common/DTO/exportar-matriculas.dto';
import { ListarBautismoDto } from './DTO/listar-bautismo.dto';
import {
  ActualizarEstadoCatequesisBautismoDto,
  CrearInscripcionCatequesisBautismoDto,
} from './DTO/inscripcion-catequesis-bautismo.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('catequesis-bautismo')
export class CatequesisBautismoController {
  constructor(
    private readonly servicio: CatequesisBautismoService,
    private readonly exportacion: BautismoExportService,
  ) {}

  @Public()
  @Post()
  crear(@Body() dto: CrearInscripcionCatequesisBautismoDto) {
    return this.servicio.crear(dto);
  }

  // El DTO limita tamaño, página y filtros antes de consultar la BD.
  @Get()
  @Permisos('catequesis')
  listar(@Query() filtros: ListarBautismoDto) {
    return this.servicio.listar(filtros);
  }

  @Public()
  @Get('consulta')
  consultar(@Query('cedula') cedula?: string) {
    return this.servicio.consultarPorCedula(cedula ?? '');
  }

  // Descarga protegida, con la misma validación de filtros que usa el modal.
  @Get('exportar')
  @Permisos('catequesis')
  async exportar(
    @Query() filtros: ExportarMatriculasDto,
    @Res() response: Response,
  ) {
    try {
      const { buffer, fileName } = await this.exportacion.exportar(filtros);
      response.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store', // no dejar datos de los inscritos en cachés compartidas
      });
      response.send(buffer);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        mensaje: 'No se pudo generar el archivo de exportación.',
      });
    }
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

  @Delete(':id')
  @Permisos('catequesis')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.servicio.remove(id);
  }
}
