import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../Decorators/roles.decorator';
import { PERMISOS_KEY } from '../Decorators/permisos.decorator';
import { Role } from '../../Common/Enums/Roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermisos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (
      (!requiredPermisos || requiredPermisos.length === 0) &&
      (!requiredRoles || requiredRoles.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: {
        role?: string;
        roles?: string[];
        permisos?: string[];
      } | null;
    }>();
    const user = request.user;
    const misRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
      : user?.role
        ? [user.role]
        : [];
    const misPermisos: string[] = Array.isArray(user?.permisos)
      ? user.permisos
      : [];

    // El secretario tiene acceso total al panel sin restricción.
    if (misRoles.includes(Role.SECRETARIO)) {
      return true;
    }

    const cumplePermisos =
      requiredPermisos &&
      requiredPermisos.length > 0 &&
      requiredPermisos.some((permiso) => misPermisos.includes(permiso));
    const cumpleRoles =
      requiredRoles &&
      requiredRoles.length > 0 &&
      requiredRoles.some((rol) => misRoles.includes(rol));

    if (cumplePermisos || cumpleRoles) {
      return true;
    }

    throw new ForbiddenException();
  }
}
