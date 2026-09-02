import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TipoSacramentoRegistro } from '../../Common/Enums/TipoSacramentoRegistro';
import { ParentescoAbueloRegistro } from '../../Common/Enums/ParentescoAbueloRegistro';
import { BuscarSacramentosNormalizadosDto } from './DTO/buscar-sacramentos-normalizados.dto';
import { BusquedaNormalizadaService } from './busqueda-normalizada.service';
import { BautismoAbuelo } from './Entities/bautismo-abuelo.entity';
import { BautismoRegistro } from './Entities/bautismo-registro.entity';
import { ComunionRegistro } from './Entities/comunion-registro.entity';
import { PersonaSacramento } from './Entities/persona-sacramento.entity';
import { SacramentoRegistro } from './Entities/sacramento-registro.entity';

const personaRepo = (
  existente: Partial<PersonaSacramento> | null,
  savedId = 1,
) => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(existente),
  };
  return {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    update: jest.fn().mockResolvedValue(undefined),
    save: jest
      .fn()
      .mockImplementation((input) =>
        Promise.resolve({ id: savedId, ...input }),
      ),
  };
};

describe('BusquedaNormalizadaService', () => {
  it('applies filters and pagination in the database query', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: 21 }])
      .mockResolvedValueOnce([
        {
          id: 3,
          tipo: 'bautismo',
          nombre: 'Ana Pérez',
          cedula: '1-2345-6789',
          fecha: '2024-05-10',
          parroquia: 'San Blas',
        },
      ]);
    const service = new BusquedaNormalizadaService({
      query,
    } as unknown as DataSource);
    const filters: BuscarSacramentosNormalizadosDto = {
      nombre: 'ana',
      tipo: TipoSacramentoRegistro.Bautismo,
      fechaDesde: '2020-01-01',
      fechaHasta: '2024-12-31',
      page: 2,
      pageSize: 10,
      sortBy: 'fecha',
      sortDirection: 'desc',
    };

    await expect(service.buscar(filters)).resolves.toEqual({
      items: [
        {
          id: 3,
          tipo: 'bautismo',
          nombre: 'Ana Pérez',
          cedula: '1-2345-6789',
          fecha: '2024-05-10',
          parroquia: 'San Blas',
        },
      ],
      total: 21,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toContain('OFFSET $4 LIMIT $5');
    expect(query.mock.calls[1][1]).toEqual([
      '%ana%',
      '2020-01-01',
      '2024-12-31',
      10,
      10,
    ]);
  });

  it('returns an empty paginated result without records', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);
    const service = new BusquedaNormalizadaService({
      query,
    } as unknown as DataSource);

    await expect(
      service.buscar({
        page: 1,
        pageSize: 20,
        sortBy: 'fecha',
        sortDirection: 'desc',
      }),
    ).resolves.toMatchObject({ items: [], total: 0, totalPages: 1 });
  });

  it('creates the parent, auto-creates the baptized person and inserts the detail in one transaction', async () => {
    const parent = {
      id: 7,
      tipo: TipoSacramentoRegistro.Bautismo,
      idParroquia: 2,
      idPresbitero: null,
      fechaSacramento: '2024-05-10',
      observaciones: null,
    };
    const personas = personaRepo(null, 3);
    const parentRepository = {
      save: jest.fn().mockResolvedValue(parent),
      findOneBy: jest.fn().mockResolvedValue(parent),
    };
    const detailRepository = {
      insert: jest.fn().mockResolvedValue(undefined),
      // Retorna null para que la validación de duplicados deje pasar el primer bautismo.
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === SacramentoRegistro) return parentRepository;
        return detailRepository;
      }),
      query: jest.fn().mockResolvedValue([
        {
          id: 7,
          tipo: TipoSacramentoRegistro.Bautismo,
          fechaSacramento: '2024-05-10',
          parroquia: {},
          presbitero: null,
          detalle: { bautizado: { id: 3 }, abuelos: [] },
        },
      ]),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await service.crear({
      tipo: TipoSacramentoRegistro.Bautismo,
      idParroquia: 2,
      fechaSacramento: '2024-05-10',
      bautismo: {
        bautizado: {
          nombre: 'Juan',
          primerApellido: 'Pérez',
          cedula: '1-2345-6789',
        },
      },
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(personas.save).toHaveBeenCalledWith(
      expect.objectContaining({ cedula: '1-2345-6789', nombre: 'Juan' }),
    );
    expect(parentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TipoSacramentoRegistro.Bautismo }),
    );
    expect(detailRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ idSacramento: 7, idBautizado: 3 }),
    );
  });

  it('reuses an existing person by cedula without creating a duplicate', async () => {
    const personas = personaRepo({ id: 5, cedula: '1-2345-6789' });
    const parent = {
      id: 9,
      tipo: TipoSacramentoRegistro.Comunion,
      idParroquia: 2,
      idPresbitero: null,
      fechaSacramento: '2025-01-01',
      observaciones: null,
    };
    const parentRepository = {
      save: jest.fn().mockResolvedValue(parent),
      findOneBy: jest.fn().mockResolvedValue(parent),
    };
    const comunionRepository = {
      insert: jest.fn().mockResolvedValue(undefined),
      // null para que la validación de duplicados permita crear la primera comunión.
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const bautismoRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ idSacramento: 1, idBautizado: 5 }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === SacramentoRegistro) return parentRepository;
        if (entity === BautismoRegistro) return bautismoRepository;
        return comunionRepository;
      }),
      query: jest.fn().mockResolvedValue([
        {
          id: 9,
          tipo: TipoSacramentoRegistro.Comunion,
          fechaSacramento: '2025-01-01',
          parroquia: {},
          presbitero: null,
          detalle: { persona: { id: 5 } },
        },
      ]),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await service.crear({
      tipo: TipoSacramentoRegistro.Comunion,
      idParroquia: 2,
      fechaSacramento: '2025-01-01',
      comunion: {
        persona: {
          nombre: 'Juan',
          primerApellido: 'Pérez',
          cedula: '1-2345-6789',
        },
      },
    });

    expect(personas.save).not.toHaveBeenCalled();
    expect(comunionRepository.insert).toHaveBeenCalledWith({
      idSacramento: 9,
      idPersona: 5,
    });
  });

  it('rejects a second baptism for the same person (the cedula cannot repeat)', async () => {
    const personas = personaRepo({ id: 3, cedula: '1-2345-6789' });
    const parentRepository = { save: jest.fn() };
    const bautismoRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ idSacramento: 1, idBautizado: 3 }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === BautismoRegistro) return bautismoRepository;
        return parentRepository;
      }),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Bautismo,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        bautismo: {
          bautizado: {
            nombre: 'Juan',
            primerApellido: 'Pérez',
            cedula: '1-2345-6789',
          },
        },
      }),
    ).rejects.toThrow('ya tiene un bautismo registrado');
    expect(parentRepository.save).not.toHaveBeenCalled();
  });

  it('updates an existing baptism via PUT preserving its detail', async () => {
    const current = {
      id: 7,
      tipo: TipoSacramentoRegistro.Bautismo,
      idParroquia: 2,
      idPresbitero: 1,
      fechaSacramento: '2024-05-10',
      observaciones: 'nota',
    };
    const personas = personaRepo({ id: 3, cedula: '1-2345-6789' });
    const parentRepository = {
      findOneBy: jest.fn().mockResolvedValue(current),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const bautismoRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    const abueloRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === SacramentoRegistro) return parentRepository;
        if (entity === BautismoAbuelo) return abueloRepository;
        return bautismoRepository;
      }),
      query: jest.fn().mockResolvedValue([
        {
          id: 7,
          tipo: 'bautismo',
          fechaSacramento: '2024-05-10',
          parroquia: {},
          presbitero: null,
          detalle: { bautizado: { id: 3 }, abuelos: [] },
        },
      ]),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    const result = await service.actualizar(7, {
      fechaSacramento: '2024-06-01',
      bautismo: {
        bautizado: {
          nombre: 'Juan',
          primerApellido: 'Pérez',
          cedula: '1-2345-6789',
        },
        libro: '1',
        folio: '2',
        asiento: '3',
      },
    });

    expect(parentRepository.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ fechaSacramento: '2024-06-01' }),
    );
    expect(bautismoRepository.update).toHaveBeenCalledWith(
      { idSacramento: 7 },
      expect.objectContaining({ idBautizado: 3 }),
    );
    // Al editar con cédula, la persona existente se actualiza con el nombre/apellidos nuevos.
    expect(personas.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ nombre: 'Juan', primerApellido: 'Pérez' }),
    );
    expect(result.id).toBe(7);
  });

  it('updates an existing communion via PUT even without a normalized baptism', async () => {
    const current = {
      id: 9,
      tipo: TipoSacramentoRegistro.Comunion,
      idParroquia: 2,
      idPresbitero: null,
      fechaSacramento: '2025-01-01',
      observaciones: null,
    };
    const personas = personaRepo({ id: 5, cedula: '1-2345-6789' });
    const parentRepository = {
      findOneBy: jest.fn().mockResolvedValue(current),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const comunionRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === SacramentoRegistro) return parentRepository;
        return comunionRepository;
      }),
      query: jest.fn().mockResolvedValue([
        {
          id: 9,
          tipo: 'comunion',
          fechaSacramento: '2025-01-01',
          parroquia: {},
          presbitero: null,
          detalle: { persona: { id: 5 } },
        },
      ]),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    const result = await service.actualizar(9, {
      fechaSacramento: '2025-02-01',
      comunion: {
        persona: {
          nombre: 'Juan',
          primerApellido: 'Pérez',
          cedula: '1-2345-6789',
        },
      },
    });

    expect(comunionRepository.update).toHaveBeenCalledWith(
      { idSacramento: 9 },
      { idPersona: 5 },
    );
    expect(result.id).toBe(9);
  });

  it('propagates the error so the transaction can roll back', async () => {
    const failure = new Error('detail failed');
    const personas = personaRepo({ id: 3 });
    const parentRepository = {
      // findOneBy lo usa la validación de duplicados antes de llegar al save.
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockRejectedValue(failure),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === PersonaSacramento ? personas : parentRepository,
      ),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Bautismo,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        bautismo: {
          bautizado: { nombre: 'Juan', primerApellido: 'Pérez' },
        },
      }),
    ).rejects.toThrow('detail failed');
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects communion when the person has no previous baptism', async () => {
    const personas = personaRepo({ id: 3 });
    const parentRepository = { save: jest.fn() };
    const baptismRepository = { findOneBy: jest.fn().mockResolvedValue(null) };
    const communionRepository = { insert: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PersonaSacramento) return personas;
        if (entity === BautismoRegistro) return baptismRepository;
        if (entity === ComunionRegistro) return communionRepository;
        return parentRepository;
      }),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Comunion,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        comunion: {
          persona: {
            nombre: 'Ana',
            primerApellido: 'Pérez',
            cedula: '2-3456-7890',
          },
        },
      }),
    ).rejects.toThrow('debe tener un bautismo registrado');
    expect(parentRepository.save).not.toHaveBeenCalled();
    expect(communionRepository.insert).not.toHaveBeenCalled();
  });

  it('rejects repeated grandparent kinship in the same baptism', async () => {
    const personas = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
      save: jest
        .fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 }),
    };
    const parentRepository = { save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === PersonaSacramento ? personas : parentRepository,
      ),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Bautismo,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        bautismo: {
          bautizado: { nombre: 'Juan', primerApellido: 'Pérez' },
          abuelos: [
            {
              nombre: 'Pedro',
              primerApellido: 'Pérez',
              parentesco: ParentescoAbueloRegistro.AbueloPaterno,
            },
            {
              nombre: 'Carlos',
              primerApellido: 'Pérez',
              parentesco: ParentescoAbueloRegistro.AbueloPaterno,
            },
          ],
        },
      }),
    ).rejects.toThrow('No puede registrar dos abuelos con el mismo parentesco');
    expect(parentRepository.save).not.toHaveBeenCalled();
  });

  it('returns all the sacraments of a person by cedula', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 15,
            cedula: '1-2345-6789',
            nombre: 'Juan',
            primerApellido: 'Pérez',
            segundoApellido: null,
            nacionalidad: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 10,
            tipo: 'bautismo',
            fechaSacramento: '2024-05-10',
            parroquia: { id: 1, nombre: 'San Blas' },
            detalle: { bautizado: { id: 15 }, abuelos: [] },
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    const result = await service.obtenerSacramentosPorCedula('1-2345-6789');

    expect(result.persona.id).toBe(15);
    expect(result.bautismo.detalle.bautizado.id).toBe(15);
    expect(result.comunion).toBeNull();
    expect(result.confirmacion).toBeNull();
    expect(result.matrimonio).toBeNull();
  });

  it('throws 404 when the cedula does not match any person', async () => {
    const manager = { query: jest.fn().mockResolvedValueOnce([]) };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({
      transaction,
    } as unknown as DataSource);

    await expect(
      service.obtenerSacramentosPorCedula('9-9999-9999'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists parroquias and presbiteros catalogs', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1, nombre: 'San Blas', canton: 'Nicoya' }])
      .mockResolvedValueOnce([
        { id: 2, nombre: 'Miguel', primerApellido: 'Sánchez' },
      ]);
    const service = new BusquedaNormalizadaService({
      query,
    } as unknown as DataSource);

    await expect(service.listarParroquias()).resolves.toEqual([
      { id: 1, nombre: 'San Blas', canton: 'Nicoya' },
    ]);
    await expect(service.listarPresbiteros()).resolves.toEqual([
      { id: 2, nombre: 'Miguel', primerApellido: 'Sánchez' },
    ]);
  });
});
