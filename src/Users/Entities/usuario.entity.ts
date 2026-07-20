import { Role } from '../../Common/Enums/Roles';
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
@Index(['email'], { unique: true, where: '"IsActive" = true' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', default: Role.USER, enum: Role })
  role: string;

  @Column({ select: false, nullable: true, type: 'varchar' })
  refreshTokenHash: string | null;

  @Column({ default: true })
  IsActive: boolean;
}
