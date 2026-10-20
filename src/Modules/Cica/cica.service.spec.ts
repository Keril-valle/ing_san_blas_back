// Cubre la actualización de estado de una solicitud CICA (aprobar o rechazar),
// la auditoría y los códigos de error 404 / 409.
import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CicaService } from './cica.service';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import {
  ActualizarEstadoCicaDto,
  CrearInscripcionCicaDto,
} from './DTO/inscripcion-cica.dto';

describe('CicaService.actualizarEstado', () => {
  const repositorio = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  const service = new CicaService(
    repositorio as unknown as Repository<InscripcionCica>,
  );

  const solicitudPendiente = {
    id: 7,
    estado: 'Pendiente',
    observacionAdministrativa: null,
    fechaActualizacionEstado: null,
    revisadoPor: null,
  } as InscripcionCica;

  const cambiarEstado = (
    dto: Partial<ActualizarEstadoCicaDto>,
    revisorId = 5,
  ) => service.actualizarEstado(7, dto as ActualizarEstadoCicaDto, revisorId);

  beforeEach(() => {
    jest.clearAllMocks();
    repositorio.save.mockImplementation((entidad: unknown) =>
      Promise.resolve(entidad),
    );
  });

  it('lanza NotFoundException cuando la solicitud no existe', async () => {
    repositorio.findOneBy.mockResolvedValue(null);

    await expect(cambiarEstado({ estado: 'Aprobada' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lanza ConflictException cuando ya fue aprobada', async () => {
    repositorio.findOneBy.mockResolvedValue({
      ...solicitudPendiente,
      estado: 'Aprobada',
    });

    await expect(cambiarEstado({ estado: 'Aprobada' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lanza ConflictException cuando ya fue rechazada', async () => {
    repositorio.findOneBy.mockResolvedValue({
      ...solicitudPendiente,
      estado: 'Rechazada',
    });

    await expect(cambiarEstado({ estado: 'Rechazada' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('aprueba una solicitud pendiente y registra la auditoría', async () => {
    repositorio.findOneBy.mockResolvedValue({ ...solicitudPendiente });

    const resultado = await cambiarEstado({ estado: 'Aprobada' }, 9);

    expect(resultado.estado).toBe('Aprobada');
    expect(resultado.revisadoPor).toBe(9);
    expect(resultado.fechaActualizacionEstado).toBeInstanceOf(Date);
    expect(resultado.observacionAdministrativa).toBeNull();
  });

  it('rechaza una solicitud pendiente guardando la observación', async () => {
    repositorio.findOneBy.mockResolvedValue({ ...solicitudPendiente });

    const resultado = await cambiarEstado(
      { estado: 'Rechazada', observacionAdministrativa: 'Datos incompletos' },
      9,
    );

    expect(resultado.estado).toBe('Rechazada');
    expect(resultado.observacionAdministrativa).toBe('Datos incompletos');
    expect(resultado.revisadoPor).toBe(9);
    expect(resultado.fechaActualizacionEstado).toBeInstanceOf(Date);
  });

  it('devuelve la solicitud ya guardada', async () => {
    repositorio.findOneBy.mockResolvedValue({ ...solicitudPendiente });
    const guardada = {
      ...solicitudPendiente,
      estado: 'Aprobada',
      revisadoPor: 9,
    } as InscripcionCica;
    repositorio.save.mockResolvedValue(guardada);

    const resultado = await cambiarEstado({ estado: 'Aprobada' }, 9);

    expect(resultado).toBe(guardada);
  });
});

describe('CicaService.crear: cónyuge según estado civil', () => {
  const repositorio = {
    create: jest.fn((entidad: unknown) => entidad),
    save: jest.fn((entidad: unknown) => Promise.resolve(entidad)),
  };

  const service = new CicaService(
    repositorio as unknown as Repository<InscripcionCica>,
  );

  const base = {
    tipoCedula: 'nacional',
    cedula: '123456789',
    nombre: 'Ana',
    apellido1: 'Pérez',
    fechaNacimiento: '1990-01-01',
    nacionalidad: 'Costarricense',
    telefono: '8888-8888',
    correo: 'ana@dominio.com',
    estadoCivil: 'soltero',
    conyugeNombre: 'Luis',
    conyugeApellido1: 'Pérez',
    conyugeApellido2: 'Gómez',
    necesitaBautizo: true,
    necesitaPrimeraComunion: false,
    necesitaConfirmacion: false,
    padreNombre: 'Luis',
    padreApellido1: 'Pérez',
    madreNombre: 'Marta',
    madreApellido1: 'Gómez',
    direccionHogar: 'Calle 1 casa 2',
    esCatolico: true,
  } as const;

  const crear = (datos: Partial<CrearInscripcionCicaDto>) =>
    service.crear({ ...base, ...datos } as CrearInscripcionCicaDto);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['soltero', 'divorciado'])(
    'anula el cónyuge cuando el estado es %s',
    async (estadoCivil) => {
      await crear({ estadoCivil: estadoCivil as 'soltero' });

      expect(repositorio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estadoCivil,
          conyugeNombre: null,
          conyugeApellido1: null,
          conyugeApellido2: null,
        }),
      );
    },
  );

  it('conserva el cónyuge cuando el estado implica pareja', async () => {
    await crear({ estadoCivil: 'matrimonio_catolico' });

    expect(repositorio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoCivil: 'matrimonio_catolico',
        conyugeNombre: 'Luis',
        conyugeApellido1: 'Pérez',
        conyugeApellido2: 'Gómez',
      }),
    );
  });
});
