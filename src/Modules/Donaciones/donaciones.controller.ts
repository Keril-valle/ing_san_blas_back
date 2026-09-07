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
  Query,
  Req,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DonacionesService } from './donaciones.service';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import { UpdateEstadoDonacionDto } from './DTO/update-estado-donacion.dto';
import { RechazarDonacionDto } from './DTO/rechazar-donacion.dto';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('Donacion')
export class DonacionesController {
  constructor(private readonly donacionesService: DonacionesService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.donacionesService.findAll();
  }

  // Ojo: esta ruta va antes de ':id' para que 'solicitudes' no caiga en el ParseIntPipe
  // Endpoint de solicitudes para el personal (solo admins, el 401/403 lo dan los guards globales)
  @Get('solicitudes')
  @Roles(Role.ADMIN)
  async findSolicitudes() {
    try {
      return await this.donacionesService.findSolicitudes();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Ocurrió un error al cargar las solicitudes de donación.',
      });
    }
  }

  // Cuenta las solicitudes nuevas desde la última visita del personal (banner del módulo)
  @Get('nuevas')
  @Roles(Role.ADMIN)
  async contarNuevas(@Query('desde') desde: string) {
    const fecha = new Date(desde);
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException({
        message: 'El parámetro desde debe ser una fecha válida.',
      });
    }
    const cantidad = await this.donacionesService.countNuevasDesde(fecha);
    return { cantidad };
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
  async create(@Body() body: Record<string, unknown>) {
    const dto = plainToInstance(CreateDonacionDto, body, {
      enableImplicitConversion: true,
    });
    const validationErrors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (validationErrors.length > 0) {
      const errores: Record<string, string[]> = {};
      for (const error of validationErrors) {
        if (error.constraints) {
          errores[error.property] = Object.values(error.constraints);
        }
      }
      const message =
        Object.values(errores).flat()[0] ?? 'Errores de validación.';
      throw new BadRequestException({ message, errores });
    }

    try {
      return await this.donacionesService.create(dto);
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
      return await this.donacionesService.updateEstado(
        id,
        dto.estado,
        dto.detalle,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Ocurrió un error al actualizar el estado del donativo.',
      });
    }
  }

  // Endpoint aparte para rechazar con motivo obligatorio (así queda guardado y auditado)
  @Patch(':id/rechazar')
  @Roles(Role.ADMIN)
  async rechazarDonacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarDonacionDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.donacionesService.rechazarDonacion(
        id,
        dto.motivo,
        dto.detalle,
        req.user.sub,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Ocurrió un error al rechazar el donativo.',
      });
    }
  }
}
