import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'CondicionesSaludCatequizando' })
export class CondicionSaludCatequizando {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'PortadorEnfermedadCronica', type: 'boolean', nullable: true })
  portadorEnfermedadCronica: boolean | null;

  @Column({ name: 'DescripcionEnfermedad', type: 'text', nullable: true })
  descripcionEnfermedad: string | null;

  @OneToOne(
    () => InscripcionCatequesis,
    (inscripcion) => inscripcion.condicionSalud,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
