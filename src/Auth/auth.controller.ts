import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { Auth } from './Decorators/auth.decorators';
import { Role } from '../Common/Enums/Roles';
import { AuthGuard } from './Guards/auth.guard';
import { RefreshAuthGuard } from './Guards/refresh-auth.guard';
import type { RequestWithUser } from '../Common/Interfaces/requestWithUser.interface';
import { Public } from './Decorators/public.decorator';
import { Roles } from './Decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para iniciar sesión y obtener un token JWT.
  @Throttle({ default: { limit: 5, ttl: 60000 } })// limita a 5 intentos por minuto para prevenir ataques de fuerza bruta
   @Public() // login no requiere estar autenticado (obvio, es como te autenticás)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint para crear un nuevo usuario en el sistema.
  @Throttle({ default: { limit: 3, ttl: 60000 } })// limita a 3 intentos por minuto para prevenir abusos en el registro
   @Public() // login no requiere estar autenticado (obvio, es como te autenticás)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('prueba')
 @Roles(Role.USER) // ya no hace falta @Auth() combinado, el guard global ya corre siempre
  prueba(@Req() req: RequestWithUser) {
    return this.authService.prueba(req.user);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
   @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  refresh(@Req() req: RequestWithUser) {
    return this.authService.refreshTokens(req.user.sub, req.refreshToken!);
  }
  @Public()
  @Post('logout')
  @UseGuards(RefreshAuthGuard)
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }

}
