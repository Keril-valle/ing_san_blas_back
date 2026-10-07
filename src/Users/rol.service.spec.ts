import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RolService } from './rol.service';

const rolBase = {
  id: 10,
  clave: 'editorial',
  nombre: 'Editorial',
  descripcion: '',
  permisos: ['panel'],
  esSistema: false,
};

const repositorio = (rol: unknown, totales: string[] = ['0', '0']) => ({
  findOne: jest.fn().mockResolvedValue(rol),
  remove: jest.fn().mockResolvedValue(undefined),
  query: jest
    .fn()
    .mockResolvedValueOnce([{ total: totales[0] }])
    .mockResolvedValueOnce([{ total: totales[1] }]),
});

describe('RolService.eliminar', () => {
  it('elimina un rol personalizado sin cuentas asignadas', async () => {
    const repo = repositorio({ ...rolBase });
    const service = new RolService(repo as never);

    await expect(service.eliminar(10)).resolves.toBeUndefined();
    expect(repo.remove).toHaveBeenCalledTimes(1);
  });

  it('lanza 404 si el rol no existe', async () => {
    const repo = repositorio(null);
    const service = new RolService(repo as never);

    await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('rechaza roles del sistema', async () => {
    const repo = repositorio({ ...rolBase, esSistema: true });
    const service = new RolService(repo as never);

    await expect(service.eliminar(10)).rejects.toThrow(BadRequestException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('rechaza claves reservadas', async () => {
    const repo = repositorio({ ...rolBase, clave: 'secretario' });
    const service = new RolService(repo as never);

    await expect(service.eliminar(10)).rejects.toThrow(BadRequestException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('rechaza roles con cuentas asignadas', async () => {
    const repo = repositorio({ ...rolBase }, ['0', '2']);
    const service = new RolService(repo as never);

    await expect(service.eliminar(10)).rejects.toThrow(ConflictException);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
