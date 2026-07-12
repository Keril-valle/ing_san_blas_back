import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionCatequesis } from './inscripcion-catequesis.entity';

@Entity({ name: 'PagosInscripcionCatequesis' })
export class PagoInscripcionCatequesis {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'InscripcionCatequesisId' })
  inscripcionCatequesisId: number;

  @Column({ name: 'MetodoPago' })
  metodoPago: string;

  @Column({ name: 'NumeroComprobanteSinpe' })
  numeroComprobanteSinpe: string;

  @Column({ name: 'ComprobanteArchivo' })
  comprobanteArchivo: string;

  @Column({ name: 'Monto', type: 'numeric' })
  monto: number;

  @OneToOne(() => InscripcionCatequesis, (inscripcion) => inscripcion.pago, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'InscripcionCatequesisId' })
  inscripcion: InscripcionCatequesis;
}
