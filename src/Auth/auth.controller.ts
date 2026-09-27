import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './DTO/login.dto';
import { RecuperarContrasenaDto } from './DTO/recuperar-contrasena.dto';
import { RestablecerContrasenaDto } from './DTO/restablecer-contrasena.dto';
import { Auth } from './Decorators/auth.decorators';
import { Role } from '../Common/Enums/Roles';
import { AuthGuard } from './Guards/auth.guard';
import { RefreshAuthGuard } from './Guards/refresh-auth.guard';
import type { RequestWithUser } from '../Common/Interfaces/requestWithUser.interface';
import { Public } from './Decorators/public.decorator';
import { Roles } from './Decorators/roles.decorator';
import {
  ACCESS_TOKEN_COOKIE,
  accessCookieOptions,
  clearCookieOptions,
  REFRESH_TOKEN_COOKIE,
  refreshCookieOptions,
} from './auth-cookies';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para iniciar sesión y obtener un token JWT.
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // limita a 5 intentos por minuto para prevenir ataques de fuerza bruta
  @Public() // login no requiere estar autenticado (obvio, es como te autenticás)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);
    this.setSessionCookies(res, accessToken, refreshToken);
    return { user };
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
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.sub,
      req.refreshToken!,
    );
    this.setSessionCookies(res, accessToken, refreshToken);
    return { message: 'Sesión renovada' };
  }

  // Devuelve el perfil ya validado sin exponer el JWT al JavaScript del navegador.
  @Get('session')
  session(@Req() req: RequestWithUser) {
    return { user: this.authService.getSessionUser(req.user) };
  }

  @Public()
  @Post('logout')
  @UseGuards(RefreshAuthGuard)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.logout(req.user.sub);
    res.clearCookie(ACCESS_TOKEN_COOKIE, clearCookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);
    return response;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('recuperar-contrasena')
  solicitarRecuperacion(@Body() dto: RecuperarContrasenaDto) {
    return this.authService.solicitarRecuperacion(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('restablecer-contrasena')
  restablecerContrasena(@Body() dto: RestablecerContrasenaDto) {
    return this.authService.restablecerContrasena(dto);
  }

  // Centralizamos las opciones para que login y refresh roten ambas cookies igual.
  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
  }
}
