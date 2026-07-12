import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BautismoService } from './bautismo.service';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { normalizeBautismoInput } from '../../Common/Utils/sacramento-input-normalizer';

@ApiTags('Bautismo')
@Controller('Bautismo')
@Roles(Role.ADMIN)
export class BautismoController {
  constructor(private readonly bautismoService: BautismoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de bautismo (Admin)' })
  findAll() {
    return this.bautismoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro de bautismo por ID (Admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.bautismoService.findById(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear registro de bautismo (Admin)' })
  create(@Body() body: Record<string, unknown>) {
    return this.bautismoService.create(normalizeBautismoInput(body));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Actualizar registro de bautismo (Admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const input = normalizeBautismoInput(body);
    if (id !== input.id) {
      throw new BadRequestException(
        'El ID de la URL no coincide con el ID del cuerpo',
      );
    }

    const updated = await this.bautismoService.update(id, input);
    if (!updated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar registro de bautismo (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.bautismoService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
  }
}
