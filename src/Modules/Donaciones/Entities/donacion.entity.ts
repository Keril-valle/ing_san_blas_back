import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Donaciones' })
export class Donacion {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Fecha', type: 'timestamptz' })
  fecha: Date;

  @Column({ name: 'Anonimo' })
  anonimo: boolean;

  @Column({ name: 'Nombre' })
  nombre: string;

  @Column({ name: 'Correo' })
  correo: string;

  @Column({ name: 'Telefono', type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ name: 'Detalle' })
  detalle: string;

  @Column({ name: 'Estado', default: 'Pendiente' })
  estado: string;
}
