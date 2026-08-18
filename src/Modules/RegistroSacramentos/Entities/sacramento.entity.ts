import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Sacramentos' })
export class Sacramento {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Cedula', length: 30 })
  cedula: string;

  @Column({ name: 'PrimerNombre', length: 100 })
  primerNombre: string;

  @Column({
    name: 'SegundoNombre',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  segundoNombre: string | null;

  @Column({ name: 'PrimerApellido', length: 100 })
  primerApellido: string;

  @Column({ name: 'SegundoApellido', length: 100 })
  segundoApellido: string;

  @Column({ name: 'Libro', length: 30 })
  libro: string;

  @Column({ name: 'Folio', length: 30 })
  folio: string;

  @Column({ name: 'Asiento', length: 30 })
  asiento: string;
}
