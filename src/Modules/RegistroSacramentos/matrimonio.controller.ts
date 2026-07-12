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
import { MatrimonioService } from './matrimonio.service';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { normalizeMatrimonioInput } from '../../Common/Utils/sacramento-input-normalizer';

@Controller('Matrimonio')
@Roles(Role.ADMIN)
export class MatrimonioController {
  constructor(private readonly matrimonioService: MatrimonioService) {}

  @Get()
  findAll() {
    return this.matrimonioService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.matrimonioService.findById(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Record<string, unknown>) {
    return this.matrimonioService.create(normalizeMatrimonioInput(body));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const input = normalizeMatrimonioInput(body);
    if (id !== input.id) {
      throw new BadRequestException(
        'El ID de la URL no coincide con el ID del cuerpo',
      );
    }

    const updated = await this.matrimonioService.update(id, input);
    if (!updated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.matrimonioService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
  }
}
