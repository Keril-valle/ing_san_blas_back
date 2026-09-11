import { Role } from '../../Common/Enums/Roles';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['email'], { unique: true, where: '"isActive" = true' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', length: 40, default: Role.USER })
  role: string;

  @Column({ select: false, nullable: true, type: 'varchar' })
  refreshTokenHash: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;
}
