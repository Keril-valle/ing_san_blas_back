import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Bautismos' })
export class Bautismo {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Nombre', length: 100 })
  nombre: string;

  @Column({ name: 'Cedula', type: 'int' })
  cedula: number;

  @Column({ name: 'PrimerApellido', length: 100 })
  primerApellido: string;

  @Column({ name: 'SegundoApellido', length: 100 })
  segundoApellido: string;

  @Column({ name: 'NombreParroquia', length: 150 })
  nombreParroquia: string;

  @Column({ name: 'FechaBautismo', type: 'timestamptz' })
  fechaBautismo: Date;

  @Column({ name: 'AnnioBautismo', type: 'int' })
  annioBautismo: number;

  @Column({ name: 'Prebispero', length: 100 })
  prebispero: string;

  @Column({ name: 'FechaNacimiento', type: 'timestamptz' })
  fechaNacimiento: Date;

  @Column({ name: 'HoraNacimiento', type: 'interval' })
  horaNacimiento: string;

  @Column({ name: 'NombreAbuelosPaternos', length: 200 })
  nombreAbuelosPaternos: string;

  @Column({ name: 'NombreAbuelosMaternos', length: 200 })
  nombreAbuelosMaternos: string;
}
