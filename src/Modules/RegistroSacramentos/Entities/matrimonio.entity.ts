import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Matrimonios' })
export class Matrimonio {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'NombreContrayente', length: 100 })
  nombreContrayente: string;

  @Column({ name: 'NombreContrayente2', length: 100 })
  nombreContrayente2: string;

  @Column({ name: 'DiaMatrimonio', length: 10 })
  diaMatrimonio: string;

  @Column({ name: 'MesMatrimonio', length: 20 })
  mesMatrimonio: string;

  @Column({ name: 'AnnioMatrimonio', type: 'int' })
  annioMatrimonio: number;

  @Column({ name: 'LugarMatrimonio', length: 150 })
  lugarMatrimonio: string;

  @Column({ name: 'Tomo', type: 'int' })
  tomo: number;

  @Column({ name: 'Folio', type: 'int' })
  folio: number;
}
