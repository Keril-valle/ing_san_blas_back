import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { DonacionesService } from './donaciones.service';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import { UpdateEstadoDonacionDto } from './DTO/update-estado-donacion.dto';
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
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDonacionDto,
  ) {
    try {
      return await this.donacionesService.updateEstado(id, dto.estado);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Ocurrió un error al actualizar el estado del donativo.',
      });
    }
  }
}
