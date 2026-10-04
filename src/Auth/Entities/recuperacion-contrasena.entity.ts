import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../Users/Entities/usuario.entity';

// Índices con el nombre real que usan en la BD (ver comentario en
// sacramento-registro.entity.ts).
@Entity('recuperacion_contrasena')
@Index('IDX_recuperacion_contrasena_usuarioId', ['usuarioId'])
@Index('UQ_recuperacion_contrasena_tokenHash', ['tokenHash'], {
  unique: true,
})
export class RecuperacionContrasena {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
