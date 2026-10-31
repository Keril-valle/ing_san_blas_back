import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { UsuarioService } from './usuario.service';
import { Usuario } from './Entities/usuario.entity';
import type { RolService } from './rol.service';
import type { UpdateUsuarioDto } from './DTO/update-usuario.dto';

type Fila = Record<string, unknown> & { id?: number; isActive?: boolean };

const crearServicio = (usuario: Fila | null, otroActivo: Fila | null = null) => {
  const guardar = jest.fn((entidad: Fila) => Promise.resolve(entidad));

  const findOneBy = jest.fn((where: Record<string, unknown>) => {
    if (!usuario) return Promise.resolve(null);

    if (where.id !== undefined) {
      if (where.id !== usuario.id) return Promise.resolve(null);
      if (where.isActive === true && usuario.isActive !== true) {
        return Promise.resolve(null);
      }
      return Promise.resolve(usuario);
    }

    // Búsqueda por correo: al reactivar solo interesa otra cuenta activa;
    // al crear se busca cualquier cuenta (activa o inactiva).
    if (where.email !== undefined) {
      if (where.isActive === true) {
        return Promise.resolve(usuario.isActive === true ? usuario : otroActivo);
      }
      return Promise.resolve(usuario);
    }

    return Promise.resolve(usuario);
  });

  const repository = {
    findOneBy,
    save: guardar,
    manager: { query: jest.fn().mockResolvedValue([{ clave: 'user' }]) },
  } as unknown as Repository<Usuario>;

  const rolService = {
    assertExisten: jest.fn().mockResolvedValue([{ id: 1, clave: 'user' }]),
    assertExiste: jest.fn().mockResolvedValue({ id: 1, clave: 'user' }),
  } as unknown as RolService;

  return {
    service: new UsuarioService(repository, rolService),
    guardar,
    findOneBy,
  };
};

const usuarioBase = (extra: Fila = {}): Fila => ({
  id: 3,
  nombre: 'Ana Pérez',
  email: 'ana@prueba.com',
  role: 'user',
  isActive: true,
  telefono: '8888-8888',
  passwordChangedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...extra,
});

describe('UsuarioService — reactivación de cuentas', () => {
  it('reactiva una cuenta inactiva (antes el filtro isActive daba 404)', async () => {
    const inactiva = usuarioBase({ isActive: false });
    const { service, guardar, findOneBy } = crearServicio(inactiva);

    const respuesta = await service.update(3, {
      isActive: true,
    } as UpdateUsuarioDto);

    // La búsqueda inicial no debe exigir que la cuenta ya esté activa.
    expect(findOneBy).toHaveBeenCalledWith({ id: 3 });
    expect(guardar).toHaveBeenCalled();
    expect(respuesta.state).toBe(true);
    expect(inactiva.isActive).toBe(true);
  });

  it('rechaza reactivar si otra cuenta activa usa el mismo correo', async () => {
    const inactiva = usuarioBase({ isActive: false });
    const otraActiva = usuarioBase({ id: 20, isActive: true });
    const { service, guardar } = crearServicio(inactiva, otraActiva);

    await expect(
      service.update(3, { isActive: true } as UpdateUsuarioDto),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('no permite crear una cuenta nueva con el correo de una cuenta inactiva', async () => {
    const inactiva = usuarioBase({ isActive: false });
    const { service, guardar } = crearServicio(inactiva);

    await expect(
      service.createUser({
        nombre: 'Otra Persona',
        email: 'ana@prueba.com',
        telefono: '8888-8888',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('al desactivar limpia el refresh token e invalida los access tokens previos', async () => {
    const activa = usuarioBase({ refreshTokenHash: 'hash-viejo' });
    const { service, guardar } = crearServicio(activa);

    await service.update(3, { isActive: false } as UpdateUsuarioDto);

    const guardado = guardar.mock.calls[0][0] as Fila;
    expect(guardado.isActive).toBe(false);
    expect(guardado.refreshTokenHash).toBeNull();
    expect(guardado.passwordChangedAt).toBeInstanceOf(Date);
  });

  it('remove también revoca las sesiones abiertas', async () => {
    const activa = usuarioBase({
      id: 9,
      refreshTokenHash: 'hash-viejo',
    });
    const { service, guardar } = crearServicio(activa);

    const respuesta = await service.remove(9);

    const guardado = guardar.mock.calls[0][0] as Fila;
    expect(guardado.isActive).toBe(false);
    expect(guardado.refreshTokenHash).toBeNull();
    expect(guardado.passwordChangedAt).toBeInstanceOf(Date);
    expect(respuesta.state).toBe(false);
  });
});
