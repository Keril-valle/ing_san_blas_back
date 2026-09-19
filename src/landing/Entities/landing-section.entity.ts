import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('landing_section')
export class LandingSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'section_key', type: 'varchar', unique: true })
  sectionKey: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  // fecha en que se sembró/creó la sección (solo auditoría, no la usa el editor)
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
