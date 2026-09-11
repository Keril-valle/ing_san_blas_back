import {
  Column,
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

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
