import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSolicSacramentoDto } from './DTO/create-solic-sacramento.dto';
import { UpdateSolicSacramentoDto } from './DTO/update-solic-sacramento.dto';
import { SolicSacramento } from './Entities/solic-sacramento.entity';
import { EstadoSolicitud } from 'src/Common/Enums/EstadoSolicitud';
import { TipoSacramento } from 'src/Common/Enums/TipoSacramento';

@Injectable()
export class SolicSacramentoService {
  constructor(
    @InjectRepository(SolicSacramento)
    private readonly solicSacraRepository: Repository<SolicSacramento>,
  ) {}

  create(createSolicSacramentoDto: CreateSolicSacramentoDto) {
    const solicitud = this.solicSacraRepository.create({
      ...createSolicSacramentoDto,
      //los 3 puntos (...) se utilizan para copiar todas las propiedades del DTO al nuevo objeto de solicitud
      Estado: EstadoSolicitud.PENDIENTE,
    });
    return this.solicSacraRepository.save(solicitud);
  }

  findAll() {
    return this.solicSacraRepository.find();
  }

  findOne(id: number) {
    return this.solicSacraRepository.findOneBy({ id });
  }
  async BuscarSolicPorNombre(nombre: string) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { Nombre: nombre },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el nombre ${nombre}`,
      );
    }
    return solicitudes;
  }

  async BuscarSolicPorApellido(apellido: string) {
    const solicitudes = await this.solicSacraRepository.find({
      where: [{ PrimerApellido: apellido }, { SegundoApellido: apellido }],
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el apellido ${apellido}`,
      );
    }
    return solicitudes;
  }
  async BuscarSolicPorCedula(cedula: number) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { Cedula: cedula },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con la cédula ${cedula}`,
      );
    }
    return solicitudes;
  }
  async BuscarPorEstado(estado: EstadoSolicitud) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { Estado: estado },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el estado ${estado}`,
      );
    }
    return solicitudes;
  }
  async BuscarPorTipoSacramento(tipoSacramento: TipoSacramento) {
    const solicitudes = await this.solicSacraRepository.find({
      where: { TipoSacramento: tipoSacramento },
    });
    if (solicitudes.length === 0) {
      throw new NotFoundException(
        `No se encontraron solicitudes con el tipo de sacramento ${tipoSacramento}`,
      );
    }
    return solicitudes;
  }

  async CambiarEstadoSolicitud(id: number, nuevoEstado: EstadoSolicitud) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    solicitud.Estado = nuevoEstado;
    return this.solicSacraRepository.save(solicitud);
  }

  async verEstadoSolicitud(id: number) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    return solicitud.Estado;
  }

  async update(id: number, updateSolicSacramentoDto: UpdateSolicSacramentoDto) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    Object.assign(solicitud, updateSolicSacramentoDto);
    return this.solicSacraRepository.save(solicitud);
  }

  async remove(id: number) {
    const solicitud = await this.solicSacraRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    return this.solicSacraRepository.remove(solicitud);
  }
}
