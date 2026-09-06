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

  it('stores the optional approval detalle', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockImplementation(async (donacion: Donacion) => donacion);

    const result = await service.updateEstado(
      7,
      'Aprobado',
      'Entregar en portería',
    );

    expect(result.estado).toBe('Aprobado');
    const guardada = repository.save.mock.calls[0][0] as Donacion;
    expect(guardada.detalleAprobacion).toBe('Entregar en portería');
  });

  it('rejects approval detalle longer than 500 characters', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });

    await expect(
      service.updateEstado(7, 'Aprobado', 'x'.repeat(501)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
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

describe('DonacionesService.rechazarDonacion', () => {
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

  it('rejects a pending donation and stores motivo, detalle and audit data', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockImplementation(async (donacion: Donacion) => donacion);

    const result = await service.rechazarDonacion(
      7,
      'Datos incorrectos',
      'La cédula no coincide',
      9,
    );

    expect(result.estado).toBe('Rechazado');
    const guardada = repository.save.mock.calls[0][0] as Donacion;
    expect(guardada.motivoRechazo).toBe('Datos incorrectos');
    expect(guardada.detalleRechazo).toBe('La cédula no coincide');
    expect(guardada.rechazadoPor).toBe(9);
    expect(guardada.fechaRechazo).toBeInstanceOf(Date);
  });

  it('throws 404 when the donation does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.rechazarDonacion(99, 'Datos incorrectos', undefined, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not reject an already processed donation', async () => {
    repository.findOne.mockResolvedValue({
      ...donacionPendiente,
      estado: 'Aprobado',
    });

    await expect(
      service.rechazarDonacion(7, 'Datos incorrectos', undefined, 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('requires a non-empty motivo', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });

    await expect(
      service.rechazarDonacion(7, '   ', undefined, 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects detalle longer than 500 characters', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });

    await expect(
      service.rechazarDonacion(7, 'Otro', 'x'.repeat(501), 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('handles persistence errors', async () => {
    repository.findOne.mockResolvedValue({ ...donacionPendiente });
    repository.save.mockRejectedValue(new Error('db down'));

    await expect(
      service.rechazarDonacion(7, 'Datos incorrectos', undefined, 9),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('DonacionesService.findSolicitudes', () => {
  const repository = {
    find: jest.fn(),
  };
  const service = new DonacionesService(
    repository as unknown as Repository<Donacion>,
  );

  const donaciones: Donacion[] = [
    {
      id: 1,
      fecha: new Date('2026-09-02T00:00:00.000Z'),
      anonimo: false,
      nombre: 'Ana Pérez',
      correo: 'ana@example.com',
      telefono: '8888-8888',
      detalle: 'Arroz y aceite',
      estado: 'Pendiente',
    },
    {
      id: 2,
      fecha: new Date('2026-09-01T00:00:00.000Z'),
      anonimo: true,
      nombre: 'Nombre real que no debe filtrarse',
      correo: 'anonimo@example.com',
      telefono: null,
      detalle: 'Ropa',
      estado: 'Aprobado',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns solicitudes ordered by fecha desc', async () => {
    repository.find.mockResolvedValue([...donaciones]);

    const result = await service.findSolicitudes();

    expect(repository.find).toHaveBeenCalledWith({
      order: { fecha: 'DESC' },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[0].fechaIngreso).toEqual(
      new Date('2026-09-02T00:00:00.000Z'),
    );
  });

  it('hides the donor name when the donation is anonymous', async () => {
    repository.find.mockResolvedValue([...donaciones]);

    const result = await service.findSolicitudes();
    const anonima = result.find((item) => item.id === 2);

    expect(anonima?.anonimo).toBe(true);
    expect(anonima?.nombre).toBe('Anónimo');
  });

  it('keeps the donor name when the donation is not anonymous', async () => {
    repository.find.mockResolvedValue([...donaciones]);

    const result = await service.findSolicitudes();
    const identificada = result.find((item) => item.id === 1);

    expect(identificada?.nombre).toBe('Ana Pérez');
  });

  it('throws 500 when the query fails', async () => {
    repository.find.mockRejectedValue(new Error('db down'));

    await expect(service.findSolicitudes()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
