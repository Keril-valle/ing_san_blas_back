import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'inscripcion_catequesis_bautismo' })
export class InscripcionCatequesisBautismo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 25 })
  nombre: string;

  @Column({ type: 'varchar', length: 25 })
  apellido1: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  apellido2: string | null;

  @Column({ type: 'date' })
  fechaNacimiento: string;

  @Column({ type: 'varchar', length: 20 })
  cedula: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ type: 'varchar', length: 30 })
  estadoCivil: string;

  @Column({ type: 'varchar', length: 25 })
  parroquiaOrigen: string;

  @Column({ type: 'varchar', length: 40 })
  provincia: string;

  @Column({ type: 'varchar', length: 25 })
  canton: string;

  @Column({ type: 'varchar', length: 25 })
  distrito: string;

  @Column({ type: 'varchar', length: 25 })
  barrio: string;

  @Column({ type: 'varchar', length: 40 })
  condicion: string;

  @Column({ type: 'varchar', length: 20, default: 'Pendiente' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observacionAdministrativa: string | null;

  @Column({ type: 'date', nullable: true })
  fechaInicioCatequesis: string | null;

  @Column({ type: 'date', nullable: true })
  fechaFinalizacionCatequesis: string | null;

  @Column({ type: 'varchar', length: 25, nullable: true })
  responsableCertifica: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaSolicitud: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fechaActualizacionEstado: Date | null;

  @Column({ type: 'int', nullable: true })
  revisadoPor: number | null;
}
