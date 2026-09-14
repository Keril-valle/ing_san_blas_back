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

  @Column({ name: 'PrimerApellido' })
  primerApellido: string;

  @Column({ name: 'SegundoApellido', type: 'varchar', nullable: true })
  segundoApellido: string | null;

  @Column({ name: 'Parentesco' })
  parentesco: string;

  @Column({ name: 'Correo', type: 'varchar', nullable: true })
  correo: string | null;

  @Column({ name: 'Telefono', type: 'varchar', nullable: true })
  telefono: string | null;

  @OneToOne(
    () => InscripcionCatequesis,
    (inscripcion) => inscripcion.personaInscribe,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
