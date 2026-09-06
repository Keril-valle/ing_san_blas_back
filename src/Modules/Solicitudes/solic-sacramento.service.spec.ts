import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SolicSacramentoService } from './solic-sacramento.service';
import { SolicSacramento } from './Entities/solic-sacramento.entity';
import { HistorialRechazos } from './Entities/historial-rechazos.entity';
import { SolicSacramentoFileStorageService } from './solic-sacramento-file-storage.service';

// Cubre la 284: PATCH :id/rechazar con motivo obligatorio, auditoría y transacción
describe('SolicSacramentoService.rechazarSolicitud', () => {
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  const solicSacraRepository = {
    manager: {
      connection: {
        createQueryRunner: jest.fn(() => queryRunner),
      },
    },
  };

  const historialRechazosRepository = {
    create: jest.fn((dto: Partial<HistorialRechazos>) => dto),
  };

  const service = new SolicSacramentoService(
    solicSacraRepository as unknown as Repository<SolicSacramento>,
    historialRechazosRepository as unknown as Repository<HistorialRechazos>,
    {} as SolicSacramentoFileStorageService,
  );

  const solicitudPendiente = {
    id: 3,
    PrimerNombre: 'Juan',
    PrimerApellido: 'Pérez',
    SegundoApellido: 'Gómez',
    Cedula: 123456789,
    Correo: 'juan@example.com',
    Telefono: 88888888,
    Motivo: 'Constancia de bautismo',
    Estado: 'Pendiente',
  } as SolicSacramento;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza una solicitud pendiente y guarda motivo, detalle y auditoría', async () => {
    queryRunner.manager.findOne.mockResolvedValue({ ...solicitudPendiente });
    queryRunner.manager.save.mockImplementation(async (entidad: unknown) => entidad);

    const result = await service.rechazarSolicitud(
      3,
      'Datos incorrectos',
      'La cédula no coincide',
      9,
    );

    expect(result).toEqual({
      mensaje: 'Solicitud rechazada exitosamente',
      estado: 'Rechazado',
    });

    const guardada = queryRunner.manager.save.mock.calls[0][0] as SolicSacramento;
    expect(guardada.Estado).toBe('Rechazado');
    expect(guardada.MotivoRechazo).toBe('Datos incorrectos');
    expect(guardada.DetalleRechazo).toBe('La cédula no coincide');
    expect(guardada.RechazadoPor).toBe(9);
    expect(guardada.FechaRechazo).toBeInstanceOf(Date);

    expect(historialRechazosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        solicitudId: 3,
        usuarioId: 9,
        motivo: 'Datos incorrectos',
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('devuelve 404 cuando la solicitud no existe y revierte la transacción', async () => {
    queryRunner.manager.findOne.mockResolvedValue(null);

    await expect(
      service.rechazarSolicitud(99, 'Datos incorrectos', undefined, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('devuelve 400 cuando la solicitud ya fue procesada', async () => {
    queryRunner.manager.findOne.mockResolvedValue({
      ...solicitudPendiente,
      Estado: 'Aprobado',
    });

    await expect(
      service.rechazarSolicitud(3, 'Datos incorrectos', undefined, 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('devuelve 400 cuando el motivo viene vacío', async () => {
    queryRunner.manager.findOne.mockResolvedValue({ ...solicitudPendiente });

    await expect(
      service.rechazarSolicitud(3, '   ', undefined, 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('devuelve 400 cuando el detalle supera 500 caracteres', async () => {
    queryRunner.manager.findOne.mockResolvedValue({ ...solicitudPendiente });

    await expect(
      service.rechazarSolicitud(3, 'Otro', 'x'.repeat(501), 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
