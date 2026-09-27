import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Permisos } from '../Auth/Decorators/permisos.decorator';

@Controller('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Permisos('panel')
  @Get('stats')
  obtenerEstadisticas() {
    return this.dashboardService.obtenerEstadisticas();
  }
}
