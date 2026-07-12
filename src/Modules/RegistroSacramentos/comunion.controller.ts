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
import { ComunionService } from './comunion.service';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { normalizeComunionInput } from '../../Common/Utils/sacramento-input-normalizer';

@Controller('Comunion')
@Roles(Role.ADMIN)
export class ComunionController {
  constructor(private readonly comunionService: ComunionService) {}

  @Get()
  findAll() {
    return this.comunionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.comunionService.findById(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Record<string, unknown>) {
    return this.comunionService.create(normalizeComunionInput(body));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const input = normalizeComunionInput(body);
    if (id !== input.id) {
      throw new BadRequestException(
        'El ID de la URL no coincide con el ID del cuerpo',
      );
    }

    const updated = await this.comunionService.update(id, input);
    if (!updated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.comunionService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
  }
}
