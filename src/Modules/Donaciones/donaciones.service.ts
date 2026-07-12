import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Repository } from 'typeorm';
import { Donacion } from './Entities/donacion.entity';
import { CreateDonacionDto } from './DTO/create-donacion.dto';
import {
  DonacionResponseDto,
  UpdateDonacionEstadoResponseDto,
} from './DTO/donacion-response.dto';
import { normalizeDonacionEstado } from '../../Common/Utils/donacion-estado';
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class DonacionesService {
  private readonly logger = new Logger(DonacionesService.name);

  constructor(
    @InjectRepository(Donacion)
    private readonly donacionesRepository: Repository<Donacion>,
    private readonly emailService: EmailService,
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
  ): Promise<UpdateDonacionEstadoResponseDto> {
    const donacion = await this.donacionesRepository.findOne({ where: { id } });
    if (!donacion) {
      throw new NotFoundException();
    }

    const estadoNormalizado = normalizeDonacionEstado(nuevoEstado);
    donacion.estado = estadoNormalizado;
    const saved = await this.donacionesRepository.save(donacion);

    let correoEnviado = false;
    if (estadoNormalizado === 'Rechazado') {
      correoEnviado = await this.enviarCorreoRechazo(saved);
    } else if (estadoNormalizado === 'Aprobado') {
      correoEnviado = await this.enviarCorreoAprobacion(saved);
    }

    const mensajeCorreo = correoEnviado
      ? estadoNormalizado === 'Rechazado'
        ? 'Solicitud rechazada y correo enviado al usuario.'
        : 'Solicitud aprobada y correo enviado al usuario.'
      : estadoNormalizado === 'Rechazado'
        ? 'Solicitud rechazada, pero no se pudo enviar el correo. Revise EmailSettings en Railway.'
        : estadoNormalizado === 'Aprobado'
          ? 'Solicitud aprobada, pero no se pudo enviar el correo. Revise EmailSettings en Railway.'
          : 'Estado actualizado.';

    return {
      donacion: this.toResponseDto(saved),
      correoEnviado,
      mensajeCorreo,
    };
  }

  private nombreParaCorreo(donacion: Donacion): string {
    if (donacion.anonimo) {
      return 'donante';
    }
    return donacion.nombre;
  }

  private correoValidoParaNotificacion(correo?: string | null): boolean {
    const normalizado = correo?.trim().toLowerCase();
    return Boolean(
      normalizado &&
        normalizado !== 'anonimo@parroquiasanblas.org' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado),
    );
  }

  private async enviarCorreoRechazo(donacion: Donacion): Promise<boolean> {
    if (!this.correoValidoParaNotificacion(donacion.correo)) {
      this.logger.warn(
        `No se envió correo de rechazo: la donación ${donacion.id} no tiene correo válido.`,
      );
      return false;
    }

    const plantilla = await this.leerPlantilla('DonacionRechazada.html');
    if (!plantilla) {
      return false;
    }

    const cuerpo = plantilla
      .replace('{{Nombre}}', this.nombreParaCorreo(donacion))
      .replace('{{Detalle}}', donacion.detalle);

    return this.emailService.sendEmail(
      donacion.correo,
      'Su solicitud de donación fue rechazada - Parroquia San Blas',
      cuerpo,
    );
  }

  private async enviarCorreoAprobacion(donacion: Donacion): Promise<boolean> {
    if (!this.correoValidoParaNotificacion(donacion.correo)) {
      this.logger.warn(
        `No se envió correo de aprobación: la donación ${donacion.id} no tiene correo válido.`,
      );
      return false;
    }

    const plantilla = await this.leerPlantilla('DonacionEstado.html');
    if (!plantilla) {
      return false;
    }

    const cuerpo = plantilla
      .replace('{{Nombre}}', this.nombreParaCorreo(donacion))
      .replace('{{Detalle}}', donacion.detalle)
      .replace('{{Estado}}', 'Aprobado')
      .replace('{{ColorFondo}}', '#d4edda')
      .replace('{{ColorTexto}}', '#155724');

    return this.emailService.sendEmail(
      donacion.correo,
      'Su solicitud de donación fue aprobada - Parroquia San Blas',
      cuerpo,
    );
  }

  private async leerPlantilla(nombreArchivo: string): Promise<string | null> {
    const templatePath = join(process.cwd(), 'Template', nombreArchivo);

    try {
      return await readFile(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(
        `Plantilla de correo no encontrada: ${templatePath}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }
}
