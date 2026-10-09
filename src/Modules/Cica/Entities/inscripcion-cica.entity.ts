import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'inscripcion_cica' })
export class InscripcionCica {
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

  @Column({ type: 'varchar', length: 25 })
  nacionalidad: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ type: 'varchar', length: 120 })
  correo: string;

  @Column({ type: 'varchar', length: 30 })
  estadoCivil: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  conyugeNombre: string | null;

  @Column({ type: 'varchar', length: 25, nullable: true })
  conyugeApellido1: string | null;

  @Column({ type: 'varchar', length: 25, nullable: true })
  conyugeApellido2: string | null;

  @Column({ type: 'boolean', default: false })
  necesitaBautizo: boolean;

  @Column({ type: 'boolean', default: false })
  necesitaPrimeraComunion: boolean;

  @Column({ type: 'boolean', default: false })
  necesitaConfirmacion: boolean;

  @Column({ type: 'varchar', length: 25 })
  padreNombre: string;

  @Column({ type: 'varchar', length: 25 })
  padreApellido1: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  padreApellido2: string | null;

  @Column({ type: 'varchar', length: 25 })
  madreNombre: string;

  @Column({ type: 'varchar', length: 25 })
  madreApellido1: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  madreApellido2: string | null;

  @Column({ type: 'varchar', length: 100 })
  direccionHogar: string;

  @Column({ type: 'boolean' })
  esCatolico: boolean;

  @Column({ type: 'varchar', length: 25, nullable: true })
  otraIglesia: string | null;

  @Column({ type: 'text', nullable: true })
  observacion: string | null;

  @Column({ type: 'varchar', length: 20, default: 'Pendiente' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observacionAdministrativa: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaSolicitud: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fechaActualizacionEstado: Date | null;

  @Column({ type: 'int', nullable: true })
  revisadoPor: number | null;
}
