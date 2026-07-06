import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { Auth } from './Decorators/auth.decorators';
import { Role } from '../Common/Enums/Roles';
import { AuthGuard } from './Guards/auth.guard';
import { RefreshAuthGuard } from './Guards/refresh-auth.guard';

interface RequestWithUser extends Request {
  user: { sub: number; email: string; role: string };
  refreshToken?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para iniciar sesión y obtener un token JWT.
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint para crear un nuevo usuario en el sistema.
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('prueba')
  @Auth(Role.USER)
  prueba(@Req() req: RequestWithUser) {
    return this.authService.prueba(req.user);
  }
   @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  refresh(@Req() req: RequestWithUser) {
    return this.authService.refreshTokens(req.user.sub, req.refreshToken!);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }

}
