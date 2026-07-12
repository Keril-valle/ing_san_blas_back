import { EstadoSolicitud } from '../../../Common/Enums/EstadoSolicitud';
import { TipoSacramento } from '../../../Common/Enums/TipoSacramento';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
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
}
