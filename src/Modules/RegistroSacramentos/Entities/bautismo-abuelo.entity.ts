import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ParentescoAbueloRegistro } from '../../../Common/Enums/ParentescoAbueloRegistro';

@Entity({ name: 'bautismo_abuelo' })
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
