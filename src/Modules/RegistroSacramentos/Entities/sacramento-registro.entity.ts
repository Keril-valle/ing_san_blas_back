import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TipoSacramentoRegistro } from '../../../Common/Enums/TipoSacramentoRegistro';

@Entity({ name: 'sacramento' })
export class SacramentoRegistro {
  @PrimaryGeneratedColumn({ name: 'id_sacramento' })
  id: number;

  @Column({
    name: 'tipo_sacramento',
    type: 'enum',
    enum: TipoSacramentoRegistro,
    enumName: 'tipo_sacramento_registro',
  })
  tipo: TipoSacramentoRegistro;

  @Column({ name: 'id_parroquia' })
  idParroquia: number;

  @Column({ name: 'id_presbitero', type: 'integer', nullable: true })
  idPresbitero: number | null;

  @Column({ name: 'fecha_sacramento', type: 'date' })
  fechaSacramento: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'now()' })
  creadoEn: Date;

  @Column({
    name: 'actualizado_en',
    type: 'timestamptz',
    default: () => 'now()',
  })
  actualizadoEn: Date;
}
