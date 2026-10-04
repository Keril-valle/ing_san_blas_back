import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './Auth/Decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Salud del servicio: debe responder sin sesión para health checks.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
