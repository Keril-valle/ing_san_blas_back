import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'confirmacion' })
export class ConfirmacionRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_persona' })
  idPersona: number;
}
