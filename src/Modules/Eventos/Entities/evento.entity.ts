import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { EstadoEvento } from '../../../Common/Enums/EstadoEvento';

@Entity()
export class Evento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar' })
  fechaInicio: string;

  @Column({ nullable: true, type: 'varchar' })
  fechaFin: string | null;

  @Column({ type: 'varchar' })
  lugar: string;

  @Column({ type: 'varchar', nullable: true })
  hora: string | null;

  @Column({ type: 'varchar', nullable: true })
  imagenUrl: string | null;

  @Column({
    type: 'enum',
    enum: EstadoEvento,
    enumName: 'evento_estado_enum',
    default: EstadoEvento.BORRADOR,
  })
  estado: EstadoEvento;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;
}
