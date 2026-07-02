import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
//este metodo se ejecuta antes de una peticion y valida que el usuario este autenticado y pueda usar el recurso solictado
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {} //inyectamos el jwtService

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //el request es lo que envia el cliente
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;

      // Si la validación es exitosa, devuelve true, permitiendo el acceso.
      // Si la validación falla, devuelve false, denegando el acceso.
      return true; // o false, dependiendo de la lógica de tu guard.
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request) {
    //aqui separamos el token porque viene con un estandar que es bearer y el token con un espacio
    //asi es como viene Bearer asdkjalksjd entoces lo separamos en un array ["Bearer", "asdkjalksjd"] y cogemos el segundo elemento
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
