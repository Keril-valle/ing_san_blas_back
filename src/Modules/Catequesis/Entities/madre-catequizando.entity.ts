import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'MadresCatequizando' })
export class MadreCatequizando {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'Nombre' })
  nombre: string;

  @Column({ name: 'Apellidos' })
  apellidos: string;

  @Column({ name: 'DireccionExacta', type: 'text', nullable: true })
  direccionExacta: string | null;

  @Column({ name: 'Ciudad', type: 'varchar', nullable: true })
  ciudad: string | null;

  @Column({ name: 'Provincia', type: 'varchar', nullable: true })
  provincia: string | null;

  @Column({ name: 'Telefono' })
  telefono: string;

  @OneToOne(() => InscripcionCatequesis, (inscripcion) => inscripcion.madre, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
