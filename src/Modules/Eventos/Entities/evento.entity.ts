import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ default: false })
  publicado: boolean;
}
