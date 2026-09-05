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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './DTO/create-evento.dto';
import { UpdateEventoDto } from './DTO/update-evento.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';

const LIMITE_IMAGEN = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('Evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  private leerPayload<T>(req: Request): T {
    const payload = (req.body as { Payload?: string } | undefined)?.Payload;
    if (!payload?.trim()) {
      throw new BadRequestException({
        mensaje: 'Los datos del evento son obligatorios.',
      });
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      throw new BadRequestException({
        mensaje: 'El formato de los datos del evento no es válido.',
      });
    }
  }

  @Public()
  //ruta para obtener todos los eventos publicos es http://localhost:3000/Evento/publicos
  @Get('publicos')
  findPublicos() {
    return this.eventoService.findPublicos();
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.eventoService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.eventoService.findOne(+id);
  }
  //la ruta para el post es http://localhost:3000/api/Eventos
  @Public()
  @Post()
  //@Roles(Role.ADMIN)
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Post('con-imagen')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_IMAGEN))
  createWithImage(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.eventoService.createWithImage(
      this.leerPayload<CreateEventoDto>(req),
      archivo,
    );
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto) {
    return this.eventoService.update(+id, updateEventoDto);
  }

  @Put(':id/con-imagen')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('archivo', LIMITE_IMAGEN))
  updateWithImage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.eventoService.updateWithImage(
      id,
      this.leerPayload<UpdateEventoDto>(req),
      archivo,
    );
  }

  @Patch(':id/publicar')
  @Roles(Role.ADMIN)
  publicar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.publicar(id);
  }

  @Patch(':id/activar')
  @Roles(Role.ADMIN)
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.activar(id);
  }

  @Patch(':id/desactivar')
  @Roles(Role.ADMIN)
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.desactivar(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eventoService.remove(+id);
  }
}
