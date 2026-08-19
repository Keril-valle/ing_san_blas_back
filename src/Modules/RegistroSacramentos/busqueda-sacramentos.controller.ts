import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BusquedaSacramentosService } from './busqueda-sacramentos.service';
import { BuscarSacramentosDto } from './DTO/buscar-sacramentos.dto';
import { PaginadoSacramentosDto } from './DTO/sacramento-unificado.dto';
import { Roles } from '../../Auth/Decorators/roles.decorator';
import { Role } from '../../Common/Enums/Roles';
import { fechaISODesdeDDMMAAAA } from './Utils/fechas-sacramentos.util';

const CEDULA_REGEX = /^\d-\d{4}-\d{4}$/;

@Controller('Sacramentos')
@Roles(Role.ADMIN)
export class BusquedaSacramentosController {
  constructor(
    private readonly busquedaSacramentosService: BusquedaSacramentosService,
  ) {}

  @Get('buscar')
  @HttpCode(HttpStatus.OK)
  async buscar(
    @Query() filtros: BuscarSacramentosDto,
  ): Promise<PaginadoSacramentosDto> {
    this.validarCedula(filtros.cedula);
    this.validarFechas(filtros);

    return this.busquedaSacramentosService.buscar(filtros);
  }

  private validarCedula(cedula?: string): void {
    if (!cedula) {
      return;
    }
    if (!CEDULA_REGEX.test(cedula)) {
      throw new BadRequestException(
        'El formato de la cédula es inválido. Use el formato 0-0000-0000.',
      );
    }
  }

  private validarFechas(filtros: BuscarSacramentosDto): void {
    const fechas = [
      filtros.fecha,
      filtros.fechaDesde,
      filtros.fechaHasta,
    ].filter((f) => !!f);

    for (const f of fechas) {
      this.validarFechaOpcional(f);
    }

    const desde = fechaISODesdeDDMMAAAA(filtros.fechaDesde);
    const hasta = fechaISODesdeDDMMAAAA(filtros.fechaHasta);

    if (desde && hasta && desde > hasta) {
      throw new BadRequestException(
        'La fecha inicial no puede ser mayor a la fecha final.',
      );
    }
  }

  private validarFechaOpcional(fecha?: string): void {
    try {
      fechaISODesdeDDMMAAAA(fecha);
    } catch {
      throw new BadRequestException(
        'El formato de fecha es inválido. Use el formato dd/mm/aaaa con una fecha real.',
      );
    }
  }
}
