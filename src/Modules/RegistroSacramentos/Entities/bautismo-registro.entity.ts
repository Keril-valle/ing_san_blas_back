import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'bautismo' })
export class BautismoRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_bautizado' })
  idBautizado: number;

  @Column({ name: 'id_padre', type: 'integer', nullable: true })
  idPadre: number | null;

  @Column({ name: 'id_madre', type: 'integer', nullable: true })
  idMadre: number | null;

  @Column({ name: 'id_padrino', type: 'integer', nullable: true })
  idPadrino: number | null;

  @Column({ name: 'id_madrina', type: 'integer', nullable: true })
  idMadrina: number | null;

  @Column({ name: 'id_declarante', type: 'integer', nullable: true })
  idDeclarante: number | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ name: 'hora_nacimiento', type: 'time', nullable: true })
  horaNacimiento: string | null;

  @Column({
    name: 'lugar_nacimiento',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  lugarNacimiento: string | null;

  @Column({
    name: 'reconocimiento_legal',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  reconocimientoLegal: string | null;

  @Column({ name: 'libro', type: 'varchar', length: 100, nullable: true })
  libro: string | null;

  @Column({ name: 'tomo', type: 'varchar', length: 100, nullable: true })
  tomo: string | null;

  @Column({ name: 'folio', type: 'varchar', length: 100, nullable: true })
  folio: string | null;

  @Column({ name: 'asiento', type: 'varchar', length: 100, nullable: true })
  asiento: string | null;

  @Column({
    name: 'firma_parroco',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  firmaParroco: string | null;
}
