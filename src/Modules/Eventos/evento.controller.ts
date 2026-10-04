import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './DTO/create-evento.dto';
import { UpdateEventoDto } from './DTO/update-evento.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import { leerPayloadMultipart } from '../../Common/Utils/multipart-payload';
import { SUBIDA_ARCHIVO_MEMORIA } from '../../Common/Storage/subida-archivo.options';

@Controller('Evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  private leerPayload<T extends object>(
    req: Request,
    clase: new () => T,
  ): Promise<T> {
    return leerPayloadMultipart(req, clase, {
      vacio: 'Los datos del evento son obligatorios.',
      invalido: 'El formato de los datos del evento no es válido.',
    });
  }

  @Public()
  @Get('publicos')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  findPublicos() {
    return this.eventoService.findPublicos();
  }

  @Get()
  @Permisos('eventos')
  findAll() {
    return this.eventoService.findAll();
  }

  @Get(':id')
  @Permisos('eventos')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.findOne(id);
  }

  @Post()
  @Permisos('eventos')
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Post('con-imagen')
  @Permisos('eventos')
  @UseInterceptors(FileInterceptor('archivo', SUBIDA_ARCHIVO_MEMORIA))
  async createWithImage(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const payload = await this.leerPayload(req, CreateEventoDto);
    return this.eventoService.createWithImage(payload, archivo);
  }

  @Put(':id')
  @Permisos('eventos')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventoDto: UpdateEventoDto,
  ) {
    return this.eventoService.update(id, updateEventoDto);
  }

  @Put(':id/con-imagen')
  @Permisos('eventos')
  @UseInterceptors(FileInterceptor('archivo', SUBIDA_ARCHIVO_MEMORIA))
  async updateWithImage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const payload = await this.leerPayload(req, UpdateEventoDto);
    return this.eventoService.updateWithImage(id, payload, archivo);
  }

  @Patch(':id/publicar')
  @Permisos('eventos')
  publicar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.publicar(id);
  }

  @Patch(':id/activar')
  @Permisos('eventos')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.activar(id);
  }

  @Patch(':id/desactivar')
  @Permisos('eventos')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.desactivar(id);
  }

  @Delete(':id')
  @Permisos('eventos')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.eventoService.remove(id);
  }
}
