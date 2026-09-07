import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventoService } from './evento.service';
import { Evento } from './Entities/evento.entity';
import { EstadoEvento } from '../../Common/Enums/EstadoEvento';

describe('EventoService', () => {
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };
  const service = new EventoService(
    repository as unknown as Repository<Evento>,
    {} as never,
  );

  const fechaFutura = () =>
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
      timeZone: 'America/Costa_Rica',
    });

  const eventoBorrador: Omit<Evento, 'createdAt'> = {
    id: 1,
    titulo: 'Misa de domingo',
    descripcion: 'Celebración',
    fechaInicio: fechaFutura(),
    fechaFin: null,
    lugar: 'Parroquia',
    hora: '10:00',
    imagenUrl: null,
    estado: EstadoEvento.BORRADOR,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crea el evento en estado borrador', async () => {
      repository.create.mockImplementation((dto: Partial<Evento>) => dto);
      repository.save.mockImplementation((dto: Evento) => dto);

      const result = await service.create({
        titulo: 'Misa',
        descripcion: 'Desc',
        fechaInicio: fechaFutura(),
        lugar: 'Sede',
      });

      expect(result.estado).toBe(EstadoEvento.BORRADOR);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoEvento.BORRADOR }),
      );
    });
  });

  describe('findPublicos', () => {
    it('filtra solo eventos publicados', async () => {
      repository.find.mockResolvedValue([]);

      await service.findPublicos();

      expect(repository.find).toHaveBeenCalledWith({
        where: { estado: EstadoEvento.PUBLICADO },
      });
    });
  });

  describe('publicar', () => {
    it('publica un evento en borrador', async () => {
      repository.findOneBy.mockResolvedValue({ ...eventoBorrador });
      repository.save.mockImplementation((e: Evento) => e);

      const result = await service.publicar(1);

      expect(result.estado).toBe(EstadoEvento.PUBLICADO);
    });

    it('rechaza publicar un evento ya publicado', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.PUBLICADO,
      });

      await expect(service.publicar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza publicar un evento desactivado', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.DESACTIVADO,
      });

      await expect(service.publicar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('activar', () => {
    it('reactiva un evento desactivado', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.DESACTIVADO,
      });
      repository.save.mockImplementation((e: Evento) => e);

      const result = await service.activar(1);

      expect(result.estado).toBe(EstadoEvento.PUBLICADO);
    });

    it('rechaza activar un evento ya activo', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.PUBLICADO,
      });

      await expect(service.activar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza activar un borrador', async () => {
      repository.findOneBy.mockResolvedValue({ ...eventoBorrador });

      await expect(service.activar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('desactivar', () => {
    it('desactiva un evento publicado', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.PUBLICADO,
      });
      repository.save.mockImplementation((e: Evento) => e);

      const result = await service.desactivar(1);

      expect(result.estado).toBe(EstadoEvento.DESACTIVADO);
    });

    it('rechaza desactivar un evento ya desactivado', async () => {
      repository.findOneBy.mockResolvedValue({
        ...eventoBorrador,
        estado: EstadoEvento.DESACTIVADO,
      });

      await expect(service.desactivar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza desactivar un borrador', async () => {
      repository.findOneBy.mockResolvedValue({ ...eventoBorrador });

      await expect(service.desactivar(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el evento no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
