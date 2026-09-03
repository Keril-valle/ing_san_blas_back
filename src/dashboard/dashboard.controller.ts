import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../Auth/Decorators/roles.decorator';
import { Role } from '../Common/Enums/Roles';

@Controller('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  obtenerEstadisticas() {
    return this.dashboardService.obtenerEstadisticas();
  }
}
