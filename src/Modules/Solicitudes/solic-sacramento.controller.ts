import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CreateSolicSacramentoDto } from './DTO/create-solic-sacramento.dto';
import { UpdateSolicSacramentoDto } from './DTO/update-solic-sacramento.dto';
import { CambiarEstadoSolicitudDto } from './DTO/cambiar-estado-solicitud.dto';
import { RechazarSolicitudDto } from './DTO/rechazar-solicitud.dto';
import { SolicSacramentoService } from './solic-sacramento.service';
import { EstadoSolicitud } from '../../Common/Enums/EstadoSolicitud';
import { TipoSacramento } from '../../Common/Enums/TipoSacramento';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('solic-sacramento')
export class SolicSacramentoController {
  constructor(private readonly solicSacraService: SolicSacramentoService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSolicSacramentoDto: CreateSolicSacramentoDto) {
    return this.solicSacraService.create(createSolicSacramentoDto);
  }

  @Get()
  findAll() {
    return this.solicSacraService.findAll();
  }

  @Get('buscar/nombre/:nombre')
  async BuscarSolicPorNombre(@Param('nombre') nombre: string) {
    return this.solicSacraService.BuscarSolicPorNombre(nombre);
  }

  @Get('buscar/apellido/:apellido')
  async BuscarSolicPorApellido(@Param('apellido') apellido: string) {
    return this.solicSacraService.BuscarSolicPorApellido(apellido);
  }

  @Get('buscar/cedula/:cedula')
  async BuscarSolicPorCedula(@Param('cedula') cedula: string) {
    return this.solicSacraService.BuscarSolicPorCedula(+cedula);
  }

  @Get('buscar/estado/:estado')
  async BuscarPorEstado(@Param('estado') estado: EstadoSolicitud) {
    return this.solicSacraService.BuscarPorEstado(estado);
  }

  @Get('buscar/tipo/:tipoSacramento')
  async BuscarPorTipoSacramento(
    @Param('tipoSacramento') tipoSacramento: TipoSacramento,
  ) {
    return this.solicSacraService.BuscarPorTipoSacramento(tipoSacramento);
  }

  @Get('estado/:id')
  async verEstadoSolicitud(@Param('id') id: string) {
    return this.solicSacraService.verEstadoSolicitud(+id);
  }

  @Get('historial-rechazos')
  @Roles('Administrador', 'Secretario')
  async obtenerHistorialRechazos() {
    return this.solicSacraService.obtenerHistorialRechazos();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicSacraService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSolicSacramentoDto: UpdateSolicSacramentoDto,
  ) {
    return this.solicSacraService.update(+id, updateSolicSacramentoDto);
  }

  @Patch('cambiar-estado/:id')
  async CambiarEstadoSolicitud(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoSolicitudDto,
  ) {
    return this.solicSacraService.CambiarEstadoSolicitud(
      +id,
      cambiarEstadoDto.nuevoEstado,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.solicSacraService.remove(+id);
  }

  @Patch(':id/rechazar')
  @Roles('Administrador', 'Secretario')
  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() rechazarSolicitudDto: RechazarSolicitudDto,
    @Req() req: RequestWithUser,
  ) {
    return this.solicSacraService.rechazarSolicitud(
      +id,
      rechazarSolicitudDto.motivoRechazo,
      rechazarSolicitudDto.detalleRechazo,
      req.user.sub,
    );
  }
}
