import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'presbitero' })
export class PresbiteroSacramento {
  @PrimaryGeneratedColumn({ name: 'id_presbitero' })
  id: number;

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
}
