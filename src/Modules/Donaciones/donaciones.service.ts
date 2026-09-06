import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donacion } from './Entities/donacion.entity';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import { DonacionResponseDto } from './DTO/donacion-response.dto';
import { SolicitudDonacionResponseDto } from './DTO/solicitud-donacion-response.dto';
import {
  isEstadoFinalDonacion,
  normalizeDonacionEstado,
} from '../../Common/Utils/donacion-estado';

@Injectable()
export class DonacionesService {
  constructor(
    @InjectRepository(Donacion)
    private readonly donacionesRepository: Repository<Donacion>,
  ) {}

  private toResponseDto(donacion: Donacion): DonacionResponseDto {
    return {
      id: donacion.id,
      fecha: donacion.fecha,
      anonimo: donacion.anonimo,
      nombre: donacion.nombre,
      correo: donacion.correo,
      telefono: donacion.telefono,
      detalle: donacion.detalle,
      estado: donacion.estado,
    };
  }

  async findAll(): Promise<DonacionResponseDto[]> {
    const donaciones = await this.donacionesRepository.find({
      order: { fecha: 'DESC' },
    });
    return donaciones.map((donacion) => this.toResponseDto(donacion));
  }

  // Lista las solicitudes para el personal, las más recientes primero (así el front las pinta directo)
  async findSolicitudes(): Promise<SolicitudDonacionResponseDto[]> {
    try {
      const donaciones = await this.donacionesRepository.find({
        order: { fecha: 'DESC' },
      });
      return donaciones.map((donacion) => ({
        id: donacion.id,
        anonimo: donacion.anonimo,
        nombre: donacion.anonimo ? 'Anónimo' : donacion.nombre, // nunca se filtra el nombre real de un donante anónimo
        correo: donacion.correo,
        telefono: donacion.telefono,
        detalle: donacion.detalle,
        fechaIngreso: donacion.fecha,
        estado: donacion.estado,
      }));
    } catch {
      throw new InternalServerErrorException(
        'No se pudieron cargar las solicitudes de donación. Intente de nuevo.',
      );
    }
  }

  async findById(id: number): Promise<DonacionResponseDto | null> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    return donacion ? this.toResponseDto(donacion) : null;
  }

  async create(dto: CreateDonacionDto): Promise<DonacionResponseDto> {
    const donacion = this.donacionesRepository.create({
      fecha: new Date(),
      anonimo: dto.anonimo,
      nombre: dto.nombre.trim(),
      correo: dto.correo.trim(),
      telefono: dto.telefono?.trim() || null,
      detalle: dto.detalle.trim(),
      estado: 'Pendiente',
    });

    const saved = await this.donacionesRepository.save(donacion);
    return this.toResponseDto(saved);
  }

  async updateEstado(
    id: number,
    nuevoEstado: string,
    detalle?: string,
  ): Promise<DonacionResponseDto> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    if (!donacion) {
      throw new NotFoundException('No se encontró el donativo solicitado.');
    }

    if (isEstadoFinalDonacion(donacion.estado)) {
      const estadoActual = normalizeDonacionEstado(donacion.estado);
      const etiqueta = estadoActual === 'Aprobado' ? 'aprobado' : 'rechazado';
      throw new BadRequestException({
        message: `Este donativo ya fue ${etiqueta} y no puede procesarse nuevamente.`,
      });
    }

    const estadoDestino = normalizeDonacionEstado(nuevoEstado);
    if (estadoDestino === 'Pendiente') {
      throw new BadRequestException({
        message:
          'El estado del donativo solo puede cambiarse a Aprobado o Rechazado.',
      });
    }

    if (detalle && detalle.length > 500) {
      throw new BadRequestException({
        message: 'El detalle de aprobación no debe exceder 500 caracteres.',
      });
    }

    donacion.estado = estadoDestino;

    // El comentario solo se guarda al aprobar (para rechazar está el endpoint con motivo)
    if (estadoDestino === 'Aprobado') {
      donacion.detalleAprobacion = detalle?.trim() || undefined;
    }

    try {
      const saved = await this.donacionesRepository.save(donacion);
      return this.toResponseDto(saved);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado del donativo. Intente de nuevo.',
      );
    }
  }

  // Rechazo en endpoint aparte para guardar motivo, detalle y quién lo hizo (lo pide la 115)
  async rechazarDonacion(
    id: number,
    motivo: string,
    detalle: string | undefined,
    rechazadoPor: number,
  ): Promise<DonacionResponseDto> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    if (!donacion) {
      throw new NotFoundException('No se encontró el donativo solicitado.');
    }

    if (isEstadoFinalDonacion(donacion.estado)) {
      const estadoActual = normalizeDonacionEstado(donacion.estado);
      const etiqueta = estadoActual === 'Aprobado' ? 'aprobado' : 'rechazado';
      throw new BadRequestException({
        message: `Este donativo ya fue ${etiqueta} y no puede procesarse nuevamente.`,
      });
    }

    if (!motivo || motivo.trim() === '') {
      throw new BadRequestException({
        message: 'El motivo de rechazo es obligatorio.',
      });
    }

    if (detalle && detalle.length > 500) {
      throw new BadRequestException({
        message: 'El detalle de rechazo no debe exceder 500 caracteres.',
      });
    }

    donacion.estado = 'Rechazado';
    donacion.motivoRechazo = motivo.trim();
    donacion.detalleRechazo = detalle?.trim() || undefined;
    donacion.rechazadoPor = rechazadoPor;
    donacion.fechaRechazo = new Date();

    try {
      const saved = await this.donacionesRepository.save(donacion);
      return this.toResponseDto(saved);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo rechazar el donativo. Intente de nuevo.',
      );
    }
  }
}
