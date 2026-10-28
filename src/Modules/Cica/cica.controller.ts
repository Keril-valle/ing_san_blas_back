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
import { CicaService } from './cica.service';
import { CicaExportService } from './cica-export.service';
import { ExportarMatriculasDto } from '../../Common/DTO/exportar-matriculas.dto';
import { ListarCicaDto } from './DTO/listar-cica.dto';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
} from './DTO/inscripcion-cica.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('cica')
export class CicaController {
  constructor(
    private readonly cicaService: CicaService,
    private readonly exportacion: CicaExportService,
  ) {}

  @Public()
  @Post()
  crear(@Body() dto: CrearInscripcionCicaDto) {
    return this.cicaService.crear(dto);
  }

  // Consulta validada sin cambiar la ruta que ya usa el panel.
  @Get()
  @Permisos('catequesis')
  listar(@Query() filtros: ListarCicaDto) {
    return this.cicaService.listar(filtros);
  }

  @Public()
  @Get('consulta')
  consultar(@Query('cedula') cedula?: string) {
    return this.cicaService.consultarPorCedula(cedula ?? '');
  }

  // Va antes de :id para que «exportar» no se interprete como un identificador.
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
        'Cache-Control': 'no-store', // el archivo contiene datos personales, no se cachea
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

  @Delete(':id')
  @Permisos('catequesis')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.cicaService.remove(id);
  }
}
