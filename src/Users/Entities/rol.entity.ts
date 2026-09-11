import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 40 })
  clave: string;

  @Column({ length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 400, default: '' })
  descripcion: string;

  @Column({ type: 'jsonb', default: [] })
  permisos: string[];

  @Column({ name: 'es_sistema', default: false })
  esSistema: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
