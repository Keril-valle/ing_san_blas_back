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
import { BautismoService } from './bautismo.service';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { normalizeBautismoInput } from '../../Common/Utils/sacramento-input-normalizer';

@Controller('Bautismo')
@Roles(Role.ADMIN)
export class BautismoController {
  constructor(private readonly bautismoService: BautismoService) {}

  @Get()
  findAll() {
    return this.bautismoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.bautismoService.findById(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }
// la ruta es http://localhost:3000/Bautismo
/**
{
  
  "nombre": "Juan",
  "apellido": "Perez",
  "fechaNacimiento": "2000-01-01",
  "lugarNacimiento": "Ciudad",
  "nombrePadre": "Carlos",
  "nombreMadre": "Maria",
  "fechaBautismo": "2020-01-01",
  "lugarBautismo": "Iglesia",
  "nombrePadrino": "Jose",
  "nombreMadrina": "Ana"
}
 */

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Record<string, unknown>) {
    return this.bautismoService.create(normalizeBautismoInput(body));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.bautismoService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
  }
}
