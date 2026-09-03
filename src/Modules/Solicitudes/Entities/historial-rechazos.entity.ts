import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SolicSacramento } from './solic-sacramento.entity';
import { Usuario } from '../../../Users/Entities/usuario.entity';

@Entity('historial_rechazos')
export class HistorialRechazos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'solicitud_id' })
  solicitudId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column()
  motivo: string;

  @Column({ nullable: true })
  detalle: string;

  @Column({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @ManyToOne(() => SolicSacramento, { eager: false })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicSacramento;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
