import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type EstadoEventoDb = 'borrador' | 'publicado' | 'desactivado';

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
    enum: ['borrador', 'publicado', 'desactivado'],
    enumName: 'evento_estado_enum',
    default: 'borrador',
  })
  estado: EstadoEventoDb;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;

  publicado: boolean;
  activo: boolean;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  hidratarFlags() {
    this.publicado = this.estado !== 'borrador';
    this.activo = this.estado !== 'desactivado';
  }
}
