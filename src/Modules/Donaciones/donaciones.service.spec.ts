import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DonacionesService } from './donaciones.service';
import {
  isEstadoFinalDonacion,
  normalizeDonacionEstado,
} from '../../Common/Utils/donacion-estado';
import { Repository } from 'typeorm';
import { Donacion } from './Entities/donacion.entity';

describe('normalizeDonacionEstado', () => {
  it('normalizes approved states', () => {
    expect(normalizeDonacionEstado('Aprobado')).toBe('Aprobado');
    expect(normalizeDonacionEstado('Aprobada')).toBe('Aprobado');
    expect(normalizeDonacionEstado('Aceptada')).toBe('Aprobado');
  });

  it('normalizes rejected states', () => {
    expect(normalizeDonacionEstado('Rechazado')).toBe('Rechazado');
    expect(normalizeDonacionEstado('Rechazada')).toBe('Rechazado');
    expect(normalizeDonacionEstado('Denegada')).toBe('Rechazado');
  });

  it('defaults unknown values to Pendiente', () => {
    expect(normalizeDonacionEstado('otro')).toBe('Pendiente');
  });
});

describe('isEstadoFinalDonacion', () => {
  it('returns true for approved and rejected donations', () => {
    expect(isEstadoFinalDonacion('Aprobado')).toBe(true);
    expect(isEstadoFinalDonacion('Rechazado')).toBe(true);
    expect(isEstadoFinalDonacion('Aceptada')).toBe(true);
    expect(isEstadoFinalDonacion('Denegada')).toBe(true);
  });

  it('returns false for pending donations', () => {
    expect(isEstadoFinalDonacion('Pendiente')).toBe(false);
    expect(isEstadoFinalDonacion(undefined)).toBe(false);
  });
});

describe('DonacionesService.updateEstado', () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const service = new DonacionesService(
    repository as unknown as Repository<Donacion>,
  );

  const donacionPendiente: Donacion = {
    id: 7,
    fecha: new Date('2026-09-01T00:00:00.000Z'),
    anonimo: false,
    nombre: 'Ana Pérez',
    correo: 'ana@example.com',
    telefono: '8888-8888',
    detalle: 'Arroz y aceite',
    estado: 'Pendiente',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('approves a pending donation', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockImplementation(async (donacion: Donacion) => donacion);

    const result = await service.updateEstado(7, 'Aprobado');

    expect(result.estado).toBe('Aprobado');
    expect(repository.save).toHaveBeenCalled();
  });

  it('rejects a pending donation', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockImplementation(async (donacion: Donacion) => donacion);

    const result = await service.updateEstado(7, 'Rechazado');

    expect(result.estado).toBe('Rechazado');
  });

  it('does not process an already approved donation', async () => {
    repository.findOne.mockResolvedValue({
      ...donacionPendiente,
      estado: 'Aprobado',
    });

    await expect(service.updateEstado(7, 'Rechazado')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not process an already rejected donation', async () => {
    repository.findOne.mockResolvedValue({
      ...donacionPendiente,
      estado: 'Rechazado',
    });

    await expect(service.updateEstado(7, 'Aprobado')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid target states', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });

    await expect(service.updateEstado(7, 'Pendiente')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws when the donation does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.updateEstado(99, 'Aprobado')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('handles persistence errors', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockRejectedValue(new Error('db down'));

    await expect(service.updateEstado(7, 'Aprobado')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
