import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ActivacionCuenta } from './Entities/activacion-cuenta.entity';
import { Usuario } from '../Users/Entities/usuario.entity';
import { createHash, randomBytes } from 'node:crypto';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

type FilaActivacion = {
  id: number;
  usuarioId: number;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

const crearAuthService = (opts: {
  usuario?: Partial<Usuario> | null;
  filas?: FilaActivacion[];
  mailFalla?: boolean;
  frontendUrl?: string | null;
}) => {
  const filas = opts.filas ?? [];
  const usuario = opts.usuario;

  const findParaActivacionPorId = jest.fn(async (id: number) => {
    if (!usuario || usuario.id !== id) return null;
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      isActive: usuario.isActive,
    };
  });

  const findInactivoParaActivacion = jest.fn(async () => {
    if (!usuario || usuario.isActive) return null;
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      isActive: false,
    };
  });

  const findByEmailWithPassword = jest.fn(async () => {
    if (!usuario || !usuario.isActive) return null;
    return {
      id: usuario.id,
      email: usuario.email,
      password: usuario.password ?? 'hash',
      role: usuario.role ?? 'user',
    };
  });

  const usuarioService = {
    findParaActivacionPorId,
    findInactivoParaActivacion,
    findByEmailWithPassword,
    obtenerRolesDeUsuario: jest.fn().mockResolvedValue(['user']),
    setRefreshTokenHash: jest.fn(),
  };

  const authMailService = {
    enviarActivacionCuenta: opts.mailFalla
      ? jest.fn().mockRejectedValue(new Error('Brevo caído'))
      : jest.fn().mockResolvedValue(undefined),
    enviarRecuperacionContrasena: jest.fn(),
  };

  const configService = {
    get: jest.fn((clave: string) => {
      if (clave === 'FRONTEND_URL') {
        return opts.frontendUrl === undefined
          ? 'https://app.sanblas.test'
          : opts.frontendUrl;
      }
      if (clave === 'JWT_REFRESH_SECRET') return 'refresh';
      return undefined;
    }),
  };

  const repoActivacion = {
    findOne: jest.fn(async ({ where }: { where: { tokenHash: string } }) => {
      const fila = filas.find((f) => f.tokenHash === where.tokenHash) ?? null;
      return fila
        ? {
            id: fila.id,
            usuarioId: fila.usuarioId,
            usedAt: fila.usedAt,
            expiresAt: fila.expiresAt,
          }
        : null;
    }),
    save: jest.fn(async (fila: FilaActivacion) => {
      const idx = filas.findIndex((f) => f.id === fila.id);
      if (idx >= 0) filas[idx] = { ...filas[idx], ...fila };
      else filas.push({ ...fila, id: filas.length + 1 });
      return fila;
    }),
    createQueryBuilder: jest.fn(() => {
      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(async () => {
          // used by activarCuenta with tokenHash in where — simplified in transaction mock
          return null;
        }),
      };
      return qb;
    }),
  };

  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ActivacionCuenta) return repoActivacion;
      return {
        findOne: jest.fn(),
        update: jest.fn(),
      };
    }),
    transaction: jest.fn(async (cb: (manager: unknown) => Promise<void>) => {
      const manager = {
        createQueryBuilder: () => ({
          update: () => ({
            set: () => ({
              where: () => ({
                execute: jest.fn().mockResolvedValue(undefined),
              }),
            }),
          }),
        }),
        getRepository: (entity: unknown) => {
          if (entity === ActivacionCuenta) {
            return {
              save: jest.fn(async (fila: FilaActivacion | Omit<FilaActivacion, 'id'>) => {
                if ('id' in fila && fila.id) {
                  const idx = filas.findIndex((f) => f.id === fila.id);
                  if (idx >= 0) {
                    filas[idx] = { ...filas[idx], ...fila };
                    return filas[idx];
                  }
                }
                const nueva = {
                  ...(fila as Omit<FilaActivacion, 'id'>),
                  id: filas.length + 1,
                } as FilaActivacion;
                filas.push(nueva);
                return nueva;
              }),
              createQueryBuilder: () => {
                let tokenHashBuscado = '';
                const qb = {
                  setLock: jest.fn().mockReturnThis(),
                  where: jest.fn(
                    (_sql: string, params: { tokenHash: string }) => {
                      tokenHashBuscado = params.tokenHash;
                      return qb;
                    },
                  ),
                  getOne: jest.fn(async () => {
                    const fila = filas.find(
                      (f) => f.tokenHash === tokenHashBuscado,
                    );
                    return fila ? { ...fila } : null;
                  }),
                };
                return qb;
              },
            };
          }
          if (entity === Usuario) {
            return {
              findOne: jest.fn(async () =>
                usuario
                  ? { id: usuario.id, isActive: usuario.isActive }
                  : null,
              ),
            };
          }
          return {};
        },
        update: jest.fn(
          async (
            _entity: unknown,
            id: number,
            data: { isActive?: boolean },
          ) => {
            if (usuario && usuario.id === id && data.isActive !== undefined) {
              usuario.isActive = data.isActive;
            }
          },
        ),
        save: jest.fn(async (fila: FilaActivacion) => {
          const idx = filas.findIndex((f) => f.id === fila.id);
          if (idx >= 0) filas[idx] = { ...filas[idx], ...fila };
          return fila;
        }),
      };
      await cb(manager);
    }),
  };

  const service = new AuthService(
    usuarioService as never,
    { permisosDeRoles: jest.fn().mockResolvedValue([]) } as never,
    { signAsync: jest.fn() } as never,
    configService as never,
    dataSource as never,
    authMailService as never,
  );

  return {
    service,
    filas,
    usuario,
    authMailService,
    findByEmailWithPassword,
  };
};

describe('AuthService — activación de cuenta', () => {
  it('emite token y envía correo para usuario inactivo', async () => {
    const { service, filas, authMailService } = crearAuthService({
      usuario: {
        id: 5,
        email: 'nuevo@prueba.com',
        nombre: 'Nuevo',
        isActive: false,
      },
    });

    const enviado = await service.emitirActivacion(5);

    expect(enviado).toBe(true);
    expect(filas).toHaveLength(1);
    expect(filas[0].usedAt).toBeNull();
    expect(authMailService.enviarActivacionCuenta).toHaveBeenCalled();
    const enlace = (
      authMailService.enviarActivacionCuenta as jest.Mock
    ).mock.calls[0][0].enlace as string;
    expect(enlace).toContain('/activar-cuenta?token=');
    expect(enlace).not.toContain(filas[0].tokenHash);
  });

  it('si Brevo falla, emitirActivacion retorna false sin lanzar', async () => {
    const { service } = crearAuthService({
      usuario: {
        id: 5,
        email: 'nuevo@prueba.com',
        nombre: 'Nuevo',
        isActive: false,
      },
      mailFalla: true,
    });

    await expect(service.emitirActivacion(5)).resolves.toBe(false);
  });

  it('token válido activa la cuenta y no se puede reutilizar', async () => {
    const token = randomBytes(32).toString('base64url');
    const usuario = {
      id: 5,
      email: 'nuevo@prueba.com',
      nombre: 'Nuevo',
      isActive: false,
    };
    const { service, filas } = crearAuthService({
      usuario,
      filas: [
        {
          id: 1,
          usuarioId: 5,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: null,
        },
      ],
    });

    await service.activarCuenta({ token });
    expect(usuario.isActive).toBe(true);
    expect(filas[0].usedAt).toBeInstanceOf(Date);

    await expect(service.activarCuenta({ token })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza token expirado', async () => {
    const token = randomBytes(32).toString('base64url');
    const { service } = crearAuthService({
      usuario: {
        id: 5,
        email: 'nuevo@prueba.com',
        nombre: 'Nuevo',
        isActive: false,
      },
      filas: [
        {
          id: 1,
          usuarioId: 5,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() - 1000),
          usedAt: null,
        },
      ],
    });

    await expect(service.validarEnlaceActivacion({ token })).rejects.toThrow(
      /expiró/i,
    );
  });

  it('login bloquea cuentas inactivas', async () => {
    const { service, findByEmailWithPassword } = crearAuthService({
      usuario: {
        id: 5,
        email: 'nuevo@prueba.com',
        isActive: false,
        role: 'user',
      },
    });

    await expect(
      service.login({
        email: 'nuevo@prueba.com',
        password: 'Secreta123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findByEmailWithPassword).toHaveBeenCalled();
  });

  it('reenvío público no revela si el correo existe', async () => {
    const { service } = crearAuthService({ usuario: null });
    const res = await service.solicitarReenvioActivacion('nadie@prueba.com');
    expect(res.message).toMatch(/pendiente de activación/i);
  });
});
