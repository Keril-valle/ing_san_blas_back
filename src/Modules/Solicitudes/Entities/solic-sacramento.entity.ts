import { EstadoSolicitud } from '../../../Common/Enums/EstadoSolicitud';
import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index('IDX_solic_sacramento_nombre', ['PrimerNombre'])
@Index('IDX_solic_sacramento_primer_apellido', ['PrimerApellido'])
@Index('IDX_solic_sacramento_segundo_apellido', ['SegundoApellido'])
@Index('IDX_solic_sacramento_cedula', ['Cedula'])
@Index('IDX_solic_sacramento_estado', ['Estado'])
export class SolicSacramento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  PrimerNombre: string;

  @Column({ nullable: true })
  SegundoNombre?: string;

  @Column()
  PrimerApellido: string;

  @Column()
  SegundoApellido: string;

  @Column()
  Cedula: number;

  @Column()
  Correo: string;

  @Column()
  Telefono: number;

  @Column()
  Motivo: string;

  @Column({ default: EstadoSolicitud.PENDIENTE })
  Estado?: string;

  @Column({ nullable: true })
  MotivoRechazo?: string;

  @Column({ nullable: true })
  DetalleRechazo?: string;

  @Column({ nullable: true })
  RechazadoPor?: number;

  @Column({ nullable: true, type: 'timestamp' })
  FechaRechazo?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  FechaSolicitud?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  FechaAprobacion?: Date;

  @Column({ nullable: true, name: 'comprobante_url' })
  comprobanteUrl?: string;
}
