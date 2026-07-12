import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Confirmaciones' })
export class Confirmacion {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Nombre', length: 100 })
  nombre: string;

  @Column({ name: 'DiaConfirmacion', length: 10 })
  diaConfirmacion: string;

  @Column({ name: 'MesConfirmacion', length: 20 })
  mesConfirmacion: string;

  @Column({ name: 'AnnioConfirmacion', type: 'int' })
  annioConfirmacion: number;

  @Column({ name: 'LugarConfirmacion', length: 150 })
  lugarConfirmacion: string;
}
