import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Evento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column()
  fechaInicio: string;

  @Column({ nullable: true })
  fechaFin: string | null;

  @Column()
  lugar: string;

  @Column({ default: false })
  publicado: boolean;
}
