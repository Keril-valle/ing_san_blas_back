import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './DTO/create-evento.dto';
import { UpdateEventoDto } from './DTO/update-evento.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';

@Controller('Evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Public()
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

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto) {
    return this.eventoService.update(+id, updateEventoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eventoService.remove(+id);
  }
}
