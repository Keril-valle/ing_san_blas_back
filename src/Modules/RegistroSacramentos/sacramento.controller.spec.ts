import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SacramentoController } from './sacramento.controller';
import { SacramentoService } from './sacramento.service';

describe('SacramentoController', () => {
  const result = [
    {
      id: 1,
      cedula: '001234',
      primerNombre: 'Juan',
      segundoNombre: null,
      primerApellido: 'Pérez',
      segundoApellido: 'López',
      libro: '1',
      folio: '2',
      asiento: '3',
    },
  ];

  it('returns matching records with status 200 behavior', async () => {
    const searchMock = jest.fn().mockResolvedValue(result);
    const service = {
      search: searchMock,
    } as unknown as SacramentoService;
    const controller = new SacramentoController(service);

    await expect(controller.search({ nombre: 'juan' })).resolves.toEqual(
      result,
    );
    expect(searchMock).toHaveBeenCalledWith({ nombre: 'juan' });
  });

  it('rejects a search without filters with 400 behavior', async () => {
    const searchMock = jest.fn();
    const service = { search: searchMock } as unknown as SacramentoService;
    const controller = new SacramentoController(service);

    await expect(controller.search({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('rejects a search without results with 404 behavior', async () => {
    const service = {
      search: jest.fn().mockResolvedValue([]),
    } as unknown as SacramentoService;
    const controller = new SacramentoController(service);

    await expect(
      controller.search({ apellido: 'inexistente' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
