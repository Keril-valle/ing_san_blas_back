import { EstadoSolicitud } from '../../../Common/Enums/EstadoSolicitud';
import { TipoSacramento } from '../../../Common/Enums/TipoSacramento';
import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index('IDX_solic_sacramento_nombre', ['Nombre'])
@Index('IDX_solic_sacramento_primer_apellido', ['PrimerApellido'])
@Index('IDX_solic_sacramento_segundo_apellido', ['SegundoApellido'])
@Index('IDX_solic_sacramento_cedula', ['Cedula'])
@Index('IDX_solic_sacramento_estado', ['Estado'])
@Index('IDX_solic_sacramento_tipo', ['TipoSacramento'])
export class SolicSacramento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  Nombre: string;

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

  @Column({ type: 'varchar' })
  TipoSacramento: TipoSacramento;

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
}
