import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'parroquia' })
export class ParroquiaSacramento {
  @PrimaryGeneratedColumn({ name: 'id_parroquia' })
  id: number;

  @Column({ name: 'nombre', length: 150 })
  nombre: string;

  @Column({ name: 'barrio', type: 'varchar', length: 100, nullable: true })
  barrio: string | null;

  @Column({ name: 'distrito', type: 'varchar', length: 100, nullable: true })
  distrito: string | null;

  @Column({ name: 'canton', type: 'varchar', length: 100, nullable: true })
  canton: string | null;

  @Column({ name: 'provincia', type: 'varchar', length: 100, nullable: true })
  provincia: string | null;
}
