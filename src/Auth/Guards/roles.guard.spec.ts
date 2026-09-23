import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

interface JwtSimulado {
  role?: string;
  roles?: string[];
  permisos?: string[];
}

function crearContexto(user: JwtSimulado | undefined): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function crearGuard(permisos?: string[], roles?: string[]): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn((clave: string) => {
      if (clave === 'permisos') return permisos;
      return roles;
    }),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('permite el acceso cuando no hay metadatos de permisos ni roles', () => {
    const guard = crearGuard(undefined, undefined);
    expect(
      guard.canActivate(crearContexto({ roles: ['user'], permisos: [] })),
    ).toBe(true);
  });

  it('el secretario accede a todo sin restricción', () => {
    const guard = crearGuard(['eventos'], undefined);
    expect(guard.canActivate(crearContexto({ roles: ['secretario'] }))).toBe(
      true,
    );
  });

  it('el secretario con JWT anterior (solo role) también accede a todo', () => {
    const guard = crearGuard(['donaciones'], undefined);
    expect(guard.canActivate(crearContexto({ role: 'secretario' }))).toBe(true);
  });

  it('permite el acceso cuando el usuario tiene el permiso requerido', () => {
    const guard = crearGuard(['donaciones'], undefined);
    const contexto = crearContexto({
      roles: ['gestor-donaciones'],
      permisos: ['panel', 'donaciones'],
    });
    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('niega el acceso cuando el usuario no tiene el permiso requerido', () => {
    const guard = crearGuard(['eventos'], undefined);
    const contexto = crearContexto({
      roles: ['gestor-donaciones'],
      permisos: ['panel', 'donaciones'],
    });
    expect(() => guard.canActivate(contexto)).toThrow(ForbiddenException);
  });

  it('soporta el decorador @Roles heredado', () => {
    const guard = crearGuard(undefined, ['user']);
    expect(guard.canActivate(crearContexto({ roles: ['user'] }))).toBe(true);
    expect(() =>
      guard.canActivate(crearContexto({ roles: ['catequista'] })),
    ).toThrow(ForbiddenException);
  });

  it('un usuario con varios roles usa la unión de sus permisos', () => {
    const guard = crearGuard(['catequesis'], undefined);
    const contexto = crearContexto({
      roles: ['catequista', 'gestor-eventos'],
      permisos: ['panel', 'catequesis', 'eventos'],
    });
    expect(guard.canActivate(contexto)).toBe(true);
  });
});
