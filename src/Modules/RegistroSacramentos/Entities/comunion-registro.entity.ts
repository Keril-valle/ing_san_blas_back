import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'comunion' })
@Index('IDX_comunion_persona', ['idPersona'])
export class ComunionRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_persona' })
  idPersona: number;
}
