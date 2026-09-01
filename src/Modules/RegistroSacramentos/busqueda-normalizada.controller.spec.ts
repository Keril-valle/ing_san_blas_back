import { BusquedaNormalizadaController } from './busqueda-normalizada.controller';
import { BusquedaNormalizadaService } from './busqueda-normalizada.service';

describe('BusquedaNormalizadaController', () => {
  it('delegates the search filters to the normalized service', async () => {
    const filters = { page: 1, pageSize: 20 };
    const result = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    const buscar = jest.fn().mockResolvedValue(result);
    const controller = new BusquedaNormalizadaController({
      buscar,
    } as unknown as BusquedaNormalizadaService);

    await expect(controller.buscar(filters)).resolves.toEqual(result);
    expect(buscar).toHaveBeenCalledWith(filters);
  });

  it('delegates create, update, detail and delete operations', async () => {
    const service = {
      buscar: jest.fn(),
      crear: jest.fn().mockResolvedValue({ id: 1 }),
      obtener: jest.fn().mockResolvedValue({ id: 1 }),
      actualizar: jest.fn().mockResolvedValue({ id: 1 }),
      eliminar: jest.fn().mockResolvedValue(undefined),
      listarParroquias: jest.fn().mockResolvedValue([{ id: 1 }]),
      listarPresbiteros: jest.fn().mockResolvedValue([{ id: 2 }]),
      obtenerSacramentosPorCedula: jest.fn().mockResolvedValue({ persona: {} }),
    } as unknown as BusquedaNormalizadaService;
    const controller = new BusquedaNormalizadaController(service);
    const createDto = { tipo: 'bautismo' };
    const updateDto = { observaciones: 'actualizado' };

    await expect(controller.crear(createDto as never)).resolves.toEqual({
      id: 1,
    });
    await expect(controller.obtener(1)).resolves.toEqual({ id: 1 });
    await expect(controller.actualizar(1, updateDto as never)).resolves.toEqual(
      { id: 1 },
    );
    await expect(controller.eliminar(1)).resolves.toBeUndefined();
    await expect(controller.listarParroquias()).resolves.toEqual([{ id: 1 }]);
    await expect(controller.listarPresbiteros()).resolves.toEqual([{ id: 2 }]);
    await expect(
      controller.obtenerSacramentosPersona('1-2345-6789'),
    ).resolves.toEqual({
      persona: {},
    });
    expect(service.crear).toHaveBeenCalledWith(createDto);
    expect(service.obtener).toHaveBeenCalledWith(1);
    expect(service.actualizar).toHaveBeenCalledWith(1, updateDto);
    expect(service.eliminar).toHaveBeenCalledWith(1);
    expect(service.obtenerSacramentosPorCedula).toHaveBeenCalledWith(
      '1-2345-6789',
    );
  });
});
