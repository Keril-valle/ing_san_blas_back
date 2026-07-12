import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'AdecuacionesCatequizando' })
export class AdecuacionCatequizando {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'RequiereAdecuacionCentroEducativo', type: 'boolean', nullable: true })
  requiereAdecuacionCentroEducativo: boolean | null;

  @Column({ name: 'DescripcionAdecuacion', type: 'text', nullable: true })
  descripcionAdecuacion: string | null;

  @OneToOne(() => InscripcionCatequesis, (inscripcion) => inscripcion.adecuacion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
