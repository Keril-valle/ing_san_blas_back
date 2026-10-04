import { BadRequestException } from '@nestjs/common';
import { LandingService } from './landing.service';
import { LandingSection } from './Entities/landing-section.entity';
import { LANDING_SECTION_KEYS } from './landing.defaults';

const guardarManager = jest.fn((entidad: unknown, filas: LandingSection[]) =>
  Promise.resolve([entidad, filas] as const),
);

const crearRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((entrada: Partial<LandingSection>) => ({
    data: {},
    ...entrada,
  })),
  save: jest.fn((seccion: LandingSection) => Promise.resolve(seccion)),
  manager: {
    transaction: jest.fn((cb: (manager: unknown) => Promise<unknown>) =>
      cb({ save: guardarManager }),
    ),
  },
});

const crearService = (
  repo = crearRepo(),
  storage = { saveSectionImage: jest.fn() },
) => ({
  service: new LandingService(repo as never, storage as never),
  repo,
  storage,
});

describe('LandingService.findOne', () => {
  it('sin fila guardada devuelve el default con createdAt en null', async () => {
    const { service, repo } = crearService();

    const respuesta = await service.findOne('hero');

    expect(repo.findOne).toHaveBeenCalledTimes(1);
    expect(respuesta.sectionKey).toBe('hero');
    expect(respuesta.createdAt).toBeNull();
    expect(respuesta.updatedAt).toBeNull();
    expect(respuesta.data).toBeDefined();
  });

  it('rechaza una sección que no existe', async () => {
    const { service } = crearService();

    await expect(service.findOne('inexistente')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('LandingService.restablecer', () => {
  beforeEach(() => guardarManager.mockClear());

  it('consulta las secciones en una sola llamada y guarda todo en un lote', async () => {
    const { service, repo } = crearService();

    const resultado = await service.restablecer();

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(guardarManager).toHaveBeenCalledTimes(1);

    const [entidad, filas] = guardarManager.mock.calls[0];
    expect(entidad).toBe(LandingSection);
    expect(filas).toHaveLength(LANDING_SECTION_KEYS.length);
    expect(filas.every((fila) => Object.keys(fila.data ?? {}).length > 0)).toBe(
      true,
    );
    expect(resultado).toHaveLength(LANDING_SECTION_KEYS.length);
  });

  it('con claves inválidas no toca la base', async () => {
    const { service, repo } = crearService();

    await expect(service.restablecer(['cualquiera'])).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(repo.find).not.toHaveBeenCalled();
    expect(guardarManager).not.toHaveBeenCalled();
  });
});

describe('LandingService.update', () => {
  it('sube la imagen del payload y guarda la URL en la sección', async () => {
    const repo = crearRepo();
    const storage = {
      saveSectionImage: jest.fn().mockResolvedValue('https://cdn/hero.webp'),
    };
    const { service } = crearService(repo, storage);

    const archivo = { originalname: 'hero.webp' } as Express.Multer.File;

    await service.update(
      'hero',
      {
        subtitle: 'Parroquia',
        title: 'Iglesia San Blas',
        titleHighlight: 'San Blas',
        description: 'Bienvenidos a nuestra parroquia.',
      },
      { imagen: archivo },
    );

    expect(storage.saveSectionImage).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);

    const guardada = repo.save.mock.calls[0][0];
    expect(guardada.data.imageUrl).toBe('https://cdn/hero.webp');
  });

  it('sin archivo no intenta subir nada', async () => {
    const repo = crearRepo();
    const storage = {
      saveSectionImage: jest.fn().mockResolvedValue('https://cdn/hero.webp'),
    };
    const { service } = crearService(repo, storage);

    await service.update('hero', {
      subtitle: 'Parroquia',
      title: 'Iglesia San Blas',
      titleHighlight: 'San Blas',
      description: 'Bienvenidos a nuestra parroquia.',
    });

    expect(storage.saveSectionImage).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
