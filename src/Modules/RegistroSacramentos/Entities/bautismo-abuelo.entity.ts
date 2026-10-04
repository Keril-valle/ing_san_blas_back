import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ParentescoAbueloRegistro } from '../../../Common/Enums/ParentescoAbueloRegistro';

// Mismo criterio que en SacramentoRegistro: los nombres coinciden con los que
// ya existen en la BD para que el generador de migraciones no los elimine.
@Entity({ name: 'bautismo_abuelo' })
@Index('IDX_bautismo_abuelo_persona', ['idPersona'])
@Index('UQ_bautismo_abuelo_parentesco', ['idBautismo', 'parentesco'], {
  unique: true,
})
export class BautismoAbuelo {
  @PrimaryColumn({ name: 'id_bautismo' })
  idBautismo: number;

  @PrimaryColumn({ name: 'id_persona' })
  idPersona: number;

  @Column({
    name: 'parentesco',
    type: 'enum',
    enum: ParentescoAbueloRegistro,
    enumName: 'parentesco_abuelo_registro',
  })
  parentesco: ParentescoAbueloRegistro;
}
