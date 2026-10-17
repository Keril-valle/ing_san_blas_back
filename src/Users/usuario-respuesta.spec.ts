import type { Repository } from 'typeorm';
import { UsuarioService } from './usuario.service';
import { Usuario } from './Entities/usuario.entity';
import type { RolService } from './rol.service';
import type { CreateUsuarioDto } from './DTO/create-usuario.dto';
import type { UpdateUsuarioDto } from './DTO/update-usuario.dto';

type Fila = Record<string, unknown> & { id?: number };

const crearService = (usuario: Fila | null) => {
  const guardar = jest.fn((entidad: Fila) => Promise.resolve(entidad));
  const repository = {
    findOneBy: jest.fn().mockResolvedValue(usuario),
    create: jest.fn((datos: Fila) => ({
      ...datos,
      id: 7,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
    save: guardar,
    // sirve tanto para reemplazar roles como para leerlos después de guardar
    manager: { query: jest.fn().mockResolvedValue([{ clave: 'user' }]) },
  } as unknown as Repository<Usuario>;

  const rolService = {
    assertExisten: jest.fn().mockResolvedValue([{ id: 1, clave: 'user' }]),
    assertExiste: jest.fn().mockResolvedValue({ id: 1, clave: 'user' }),
  } as unknown as RolService;

  return {
    service: new UsuarioService(repository, rolService),
    guardar,
  };
};

const createDto = (extra: Partial<CreateUsuarioDto> = {}) => ({
  nombre: 'Ana Pérez',
  email: 'ana@prueba.com',
  password: 'Secreta123!',
  confirmPassword: 'Secreta123!',
  telefono: '8888-8888',
  ...extra,
});

const updateDto = (extra: Partial<UpdateUsuarioDto> = {}) =>
  ({ ...extra }) as UpdateUsuarioDto;

const serialize = (valor: unknown) => JSON.stringify(valor);

describe('UsuarioService — ninguna respuesta de usuario expone la contraseña', () => {
  it('POST /usuario (createUser) responde con el DTO y sin el hash', async () => {
    const { service } = crearService(null);

    const respuesta = await service.createUser(createDto());
    const texto = serialize(respuesta);

    expect(texto).not.toContain('password');
    expect(texto).not.toContain('refreshTokenHash');
    // mismo shape que espera el tipo Usuario del frontend
    expect(respuesta).toMatchObject({
      id: 7,
      userName: 'Ana Pérez',
      email: 'ana@prueba.com',
      phoneNumber: '8888-8888',
      state: true,
      roles: ['user'],
    });
    expect(respuesta.creationDate).toBeInstanceOf(Date);
  });

  it('PATCH /usuario/:id (update) responde con el DTO aunque cambie la contraseña', async () => {
    const guardado: Fila = {
      id: 3,
      nombre: 'Ana Pérez',
      email: 'ana@prueba.com',
      role: 'user',
      isActive: true,
      telefono: '8888-8888',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const { service, guardar } = crearService(guardado);

    const respuesta = await service.update(
      3,
      updateDto({ password: 'Nueva123!', confirmPassword: 'Nueva123!' }),
    );

    // el hash sí queda montado en la entidad guardada: es justamente el caso que fuga
    expect(guardar).toHaveBeenCalled();
    const hash = (guardado as { password?: string }).password ?? '';
    expect(hash).toMatch(/^\$2/);

    const texto = serialize(respuesta);
    expect(texto).not.toContain('password');
    expect(texto).not.toContain(hash);
    expect(respuesta).toMatchObject({
      id: 3,
      userName: 'Ana Pérez',
      email: 'ana@prueba.com',
      state: true,
      roles: ['user'],
    });
  });

  it('DELETE /usuario/:id (remove) responde con el DTO y sin datos sensibles', async () => {
    const guardado: Fila = {
      id: 9,
      nombre: 'Luis Rojas',
      email: 'luis@prueba.com',
      role: 'user',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const { service } = crearService(guardado);

    const respuesta = await service.remove(9);
    const texto = serialize(respuesta);

    expect(texto).not.toContain('password');
    expect(texto).not.toContain('refreshTokenHash');
    expect(respuesta).toMatchObject({
      id: 9,
      userName: 'Luis Rojas',
      email: 'luis@prueba.com',
      state: false,
      roles: ['user'],
    });
  });

  it('GET /usuario/email/:email (findOneByEmail) también responde con el DTO', async () => {
    const { service } = crearService({
      id: 5,
      nombre: 'Ana Pérez',
      email: 'ana@prueba.com',
      role: 'user',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const respuesta = await service.findOneByEmail('ana@prueba.com');

    expect(serialize(respuesta)).not.toContain('password');
    expect(respuesta).toMatchObject({
      id: 5,
      userName: 'Ana Pérez',
      email: 'ana@prueba.com',
      roles: ['user'],
    });
  });

  it('findOneByEmail devuelve null cuando no hay coincidencia', async () => {
    const { service } = crearService(null);

    await expect(service.findOneByEmail('no@existe.com')).resolves.toBeNull();
  });
});
