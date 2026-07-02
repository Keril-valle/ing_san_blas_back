import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { Auth } from './Decorators/auth.decorators';
import { Role } from './Decorators/Roles';
import { AuthGuard } from './Guards/auth.guard';

interface RequestWithUser extends Request {
  user: { email: string; role: string };
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
  @UseGuards(AuthGuard)
  prueba(@Req() req: RequestWithUser) {
    return this.authService.prueba(req.user);
  }
}
