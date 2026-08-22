import { DataSource } from 'typeorm';
import { TipoSacramentoRegistro } from '../../Common/Enums/TipoSacramentoRegistro';
import { BuscarSacramentosNormalizadosDto } from './DTO/buscar-sacramentos-normalizados.dto';
import { BusquedaNormalizadaService } from './busqueda-normalizada.service';
import { BautismoRegistro } from './Entities/bautismo-registro.entity';
import { ComunionRegistro } from './Entities/comunion-registro.entity';
import { SacramentoRegistro } from './Entities/sacramento-registro.entity';

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
    const service = new BusquedaNormalizadaService({ query } as unknown as DataSource);
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
    const query = jest.fn().mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);
    const service = new BusquedaNormalizadaService({ query } as unknown as DataSource);

    await expect(
      service.buscar({ page: 1, pageSize: 20, sortBy: 'fecha', sortDirection: 'desc' }),
    ).resolves.toMatchObject({ items: [], total: 0, totalPages: 1 });
  });

  it('creates the parent and detail inside one transaction', async () => {
    const parent = {
      id: 7,
      tipo: TipoSacramentoRegistro.Bautismo,
      idParroquia: 2,
      idPresbitero: null,
      fechaSacramento: '2024-05-10',
      observaciones: null,
    };
    const parentRepository = {
      save: jest.fn().mockResolvedValue(parent),
      findOneBy: jest.fn().mockResolvedValue(parent),
    };
    const detailRepository = {
      insert: jest.fn().mockResolvedValue(undefined),
      findOneBy: jest.fn().mockResolvedValue({ idSacramento: 7, idBautizado: 3 }),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === SacramentoRegistro ? parentRepository : detailRepository,
      ),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({ transaction } as unknown as DataSource);

    await service.crear({
      tipo: TipoSacramentoRegistro.Bautismo,
      idParroquia: 2,
      fechaSacramento: '2024-05-10',
      bautismo: { idBautizado: 3 },
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(parentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TipoSacramentoRegistro.Bautismo }),
    );
    expect(detailRepository.insert).toHaveBeenCalledWith({
      idSacramento: 7,
      idBautizado: 3,
    });
  });

  it('propagates the error so the transaction can roll back', async () => {
    const failure = new Error('detail failed');
    const parentRepository = { save: jest.fn().mockRejectedValue(failure) };
    const bautismoRepository = { findOneBy: jest.fn().mockResolvedValue(null) };
    const manager = {
      getRepository: jest.fn().mockReturnValue(parentRepository),
    };
    manager.getRepository.mockImplementation((entity) =>
      entity === BautismoRegistro ? bautismoRepository : parentRepository,
    );
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({ transaction } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Bautismo,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        bautismo: { idBautizado: 3 },
      }),
    ).rejects.toThrow('detail failed');
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects communion when the person has no previous baptism', async () => {
    const parentRepository = { save: jest.fn() };
    const baptismRepository = { findOneBy: jest.fn().mockResolvedValue(null) };
    const communionRepository = { insert: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === BautismoRegistro) return baptismRepository;
        if (entity === ComunionRegistro) return communionRepository;
        return parentRepository;
      }),
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new BusquedaNormalizadaService({ transaction } as unknown as DataSource);

    await expect(
      service.crear({
        tipo: TipoSacramentoRegistro.Comunion,
        idParroquia: 2,
        fechaSacramento: '2024-05-10',
        comunion: { idPersona: 3 },
      }),
    ).rejects.toThrow('debe tener un bautismo registrado');
    expect(parentRepository.save).not.toHaveBeenCalled();
    expect(communionRepository.insert).not.toHaveBeenCalled();
  });
});
