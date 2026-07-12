import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { Catequizando } from './catequizando.entity';
import { BautismoCatequizando } from './bautismo-catequizando.entity';
import { AdecuacionCatequizando } from './adecuacion-catequizando.entity';
import { CondicionSaludCatequizando } from './condicion-salud-catequizando.entity';
import { MadreCatequizando } from './madre-catequizando.entity';
import { PagoInscripcionCatequesis } from './pago-inscripcion-catequesis.entity';
import { PersonaInscribeCatequesis } from './persona-inscribe-catequesis.entity';

@Entity({ name: 'InscripcionesCatequesis' })
export class InscripcionCatequesis {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'CentroCatequesis' })
  centroCatequesis: string;

  @Column({ name: 'NivelAInscribirse' })
  nivelAInscribirse: string;

  @Column({ name: 'Estado', default: 'Pendiente' })
  estado: string;

  @Column({ name: 'FechaSolicitud', type: 'timestamptz' })
  fechaSolicitud: Date;

  @Column({ name: 'ObservacionAdministrativa', type: 'text', nullable: true })
  observacionAdministrativa: string | null;

  @Column({ name: 'FechaActualizacionEstado', type: 'timestamptz', nullable: true })
  fechaActualizacionEstado: Date | null;

  @Column({ name: 'FeBautismoArchivo' })
  feBautismoArchivo: string;

  @OneToOne(() => Catequizando, (catequizando) => catequizando.inscripcion, {
    cascade: true,
  })
  catequizando: Catequizando;

  @OneToOne(() => BautismoCatequizando, (bautismo) => bautismo.inscripcion, {
    cascade: true,
  })
  bautismo: BautismoCatequizando;

  @OneToOne(() => AdecuacionCatequizando, (adecuacion) => adecuacion.inscripcion, {
    cascade: true,
  })
  adecuacion: AdecuacionCatequizando;

  @OneToOne(
    () => CondicionSaludCatequizando,
    (condicionSalud) => condicionSalud.inscripcion,
    { cascade: true },
  )
  condicionSalud: CondicionSaludCatequizando;

  @OneToOne(() => MadreCatequizando, (madre) => madre.inscripcion, {
    cascade: true,
  })
  madre: MadreCatequizando;

  @OneToOne(() => PagoInscripcionCatequesis, (pago) => pago.inscripcion, {
    cascade: true,
  })
  pago: PagoInscripcionCatequesis;

  @OneToOne(
    () => PersonaInscribeCatequesis,
    (personaInscribe) => personaInscribe.inscripcion,
    { cascade: true },
  )
  personaInscribe: PersonaInscribeCatequesis;
}
