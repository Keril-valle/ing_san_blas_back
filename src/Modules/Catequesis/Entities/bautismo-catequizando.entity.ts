import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'BautismosCatequizando' })
export class BautismoCatequizando {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'Parroquia', type: 'varchar', nullable: true })
  parroquia: string | null;

  @Column({ name: 'Fecha', type: 'date', nullable: true })
  fecha: string | null;

  @Column({ name: 'Tomo', type: 'varchar', nullable: true })
  tomo: string | null;

  @Column({ name: 'Folio', type: 'varchar', nullable: true })
  folio: string | null;

  @Column({ name: 'Asiento', type: 'varchar', nullable: true })
  asiento: string | null;

  @OneToOne(() => InscripcionCatequesis, (inscripcion) => inscripcion.bautismo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
