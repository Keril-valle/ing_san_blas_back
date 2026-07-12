import { IsEnum } from 'class-validator';
import { EstadoSolicitud } from '../../../Common/Enums/EstadoSolicitud';

export class CambiarEstadoSolicitudDto {
  @IsEnum(EstadoSolicitud)
  nuevoEstado: EstadoSolicitud;
}
