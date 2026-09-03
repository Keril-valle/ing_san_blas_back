import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'persona' })
export class PersonaSacramento {
  @PrimaryGeneratedColumn({ name: 'id_persona' })
  id: number;

  @Index()
  @Column({ name: 'cedula', type: 'varchar', length: 30, nullable: true })
  cedula: string | null;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'primer_apellido', length: 100 })
  primerApellido: string;

  @Column({
    name: 'segundo_apellido',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  segundoApellido: string | null;

  @Column({
    name: 'nacionalidad',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nacionalidad: string | null;
}
