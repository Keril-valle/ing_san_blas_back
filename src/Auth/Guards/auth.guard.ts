import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../Decorators/public.decorator';
import { UsuarioService } from '../../Users/usuario.service';
import { ACCESS_TOKEN_COOKIE } from '../auth-cookies';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Injectable()
//este metodo se ejecuta antes de una peticion y valida que el usuario este autenticado y pueda usar el recurso solictado
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usuarioService: UsuarioService,
  ) {} //inyectamos el jwtService, el reflector y el usuarioService para poder usarlo en el guard

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Antes de validar nada, preguntamos: ¿esta ruta está marcada como pública?
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // revisa el decorator a nivel de método (ej. @Public() en login())
      context.getClass(), // revisa el decorator a nivel de controller completo
    ]);

    if (isPublic) {
      return true; // si es pública, dejamos pasar sin pedir token
    }

    //el request es lo que envia el cliente
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<
        RequestWithUser['user'] & { iat: number }
      >(token);
      request.user = payload;

      // Si el usuario fue desactivado, los tokens emitidos en sesiones previas
      // dejan de ser válidos para cualquier dispositivo.
      const vigente = await this.usuarioService.credencialesVigentes(
        payload.sub,
        payload.iat,
      );
      if (!vigente) {
        throw new UnauthorizedException();
      }

      // Si la validación es exitosa, devuelve true, permitiendo el acceso.
      // Si la validación falla, devuelve false, denegando el acceso.
      return true; // o false, dependiendo de la lógica de tu guard.
    } catch (error) {
      // un token vencido o inválido es normal; lo que no hay que tapar es un
      // fallo real (base de datos, configuración), así que ese sí se loguea
      const nombre = (error as { name?: string })?.name;
      const errorDeToken =
        nombre === 'TokenExpiredError' ||
        nombre === 'JsonWebTokenError' ||
        nombre === 'NotBeforeError';
      if (!errorDeToken) {
        this.logger.error(
          `No se pudo validar la sesión: ${String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
      throw new UnauthorizedException();
    }
  }

  // Acepta cookie para la web y header para clientes de API que lo necesiten.
  private extractToken(request: Request) {
    //aqui separamos el token porque viene con un estandar que es bearer y el token con un espacio
    //asi es como viene Bearer asdkjalksjd entoces lo separamos en un array ["Bearer", "asdkjalksjd"] y cogemos el segundo elemento
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;

    return this.readCookie(request, ACCESS_TOKEN_COOKIE);
  }

  private readCookie(request: Request, name: string): string | undefined {
    const cookie = request.headers.cookie;
    if (!cookie) return undefined;

    const value = cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1);

    return value ? decodeURIComponent(value) : undefined;
  }
}
