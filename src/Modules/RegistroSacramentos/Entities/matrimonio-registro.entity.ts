import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'matrimonio' })
export class MatrimonioRegistro {
  @PrimaryColumn({ name: 'id_sacramento' })
  idSacramento: number;

  @Column({ name: 'id_contrayente1' })
  idContrayente1: number;

  @Column({ name: 'id_contrayente2' })
  idContrayente2: number;

  @Column({ name: 'libro', type: 'varchar', length: 100, nullable: true })
  libro: string | null;

  @Column({ name: 'tomo', type: 'varchar', length: 100, nullable: true })
  tomo: string | null;

  @Column({ name: 'folio', type: 'varchar', length: 100, nullable: true })
  folio: string | null;

  @Column({ name: 'asiento', type: 'varchar', length: 100, nullable: true })
  asiento: string | null;

  @Column({ name: 'firma_parroco', type: 'varchar', length: 200, nullable: true })
  firmaParroco: string | null;
}
