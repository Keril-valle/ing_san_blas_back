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
import { ConfirmacionService } from './confirmacion.service';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { normalizeConfirmacionInput } from '../../Common/Utils/sacramento-input-normalizer';

@ApiTags('Confirmacion')
@Controller('Confirmacion')
@Roles(Role.ADMIN)
export class ConfirmacionController {
  constructor(private readonly confirmacionService: ConfirmacionService) {}

  @Get()
  findAll() {
    return this.confirmacionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.confirmacionService.findById(id);
    if (!record) {
      throw new NotFoundException();
    }
    return record;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: Record<string, unknown>) {
    return this.confirmacionService.create(normalizeConfirmacionInput(body));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const input = normalizeConfirmacionInput(body);
    if (id !== input.id) {
      throw new BadRequestException(
        'El ID de la URL no coincide con el ID del cuerpo',
      );
    }

    const updated = await this.confirmacionService.update(id, input);
    if (!updated) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.confirmacionService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
  }
}
