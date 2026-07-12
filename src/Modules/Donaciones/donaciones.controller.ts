import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { DonacionesService } from './donaciones.service';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';

@Controller('Donacion')
export class DonacionesController {
  constructor(private readonly donacionesService: DonacionesService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.donacionesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const donacion = await this.donacionesService.findById(id);
    if (!donacion) {
      throw new NotFoundException();
    }
    return donacion;
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  
  async create(@Body() createDonacionDto: CreateDonacionDto) {
    try {
      return await this.donacionesService.create(createDonacionDto);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear la donación';
      throw new BadRequestException({ message });
    }
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN)
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() nuevoEstado: unknown,
  ) {
    const estado = this.parseEstadoBody(nuevoEstado);
    return this.donacionesService.updateEstado(id, estado);
  }

  private parseEstadoBody(body: unknown): string {
    if (typeof body === 'string' && body.trim().length > 0) {
      return body.trim();
    }

    throw new BadRequestException({
      message: 'El estado enviado no es válido.',
    });
  }
}
