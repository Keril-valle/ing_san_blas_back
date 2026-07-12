import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'PersonasInscribeCatequesis' })
export class PersonaInscribeCatequesis {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'Nombre' })
  nombre: string;

  @Column({ name: 'Apellidos' })
  apellidos: string;

  @Column({ name: 'Parentesco' })
  parentesco: string;

  @OneToOne(
    () => InscripcionCatequesis,
    (inscripcion) => inscripcion.personaInscribe,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
