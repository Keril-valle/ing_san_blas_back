import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'Catequizandos' })
export class Catequizando {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'Nombre' })
  nombre: string;

  @Column({ name: 'PrimerApellido' })
  primerApellido: string;

  @Column({ name: 'SegundoApellido', type: 'varchar', nullable: true })
  segundoApellido: string | null;

  @Column({ name: 'FechaNacimiento', type: 'date' })
  fechaNacimiento: string;

  @Column({ name: 'DireccionExacta', type: 'text', nullable: true })
  direccionExacta: string | null;

  @OneToOne(
    () => InscripcionCatequesis,
    (inscripcion) => inscripcion.catequizando,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
