import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'comunion' })
export class ComunionRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_persona' })
  idPersona: number;
}
