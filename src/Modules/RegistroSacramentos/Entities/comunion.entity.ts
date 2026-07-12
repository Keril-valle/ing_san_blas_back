import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Comuniones' })
export class Comunion {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Nombre', length: 100 })
  nombre: string;

  @Column({ name: 'DiaComunion', length: 10 })
  diaComunion: string;

  @Column({ name: 'MesComunion', length: 20 })
  mesComunion: string;

  @Column({ name: 'AnnioComunion', type: 'int' })
  annioComunion: number;

  @Column({ name: 'LugarComunion', length: 150 })
  lugarComunion: string;
}
