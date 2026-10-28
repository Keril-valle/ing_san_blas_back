import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'confirmacion' })
@Index('IDX_confirmacion_persona', ['idPersona'])
export class ConfirmacionRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_persona' })
  idPersona: number;
}
