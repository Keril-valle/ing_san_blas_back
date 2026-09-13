import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDetalleAprobacionDonacion1788000000013 implements MigrationInterface {
  name = 'AddDetalleAprobacionDonacion1788000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Donaciones" ADD "DetalleAprobacion" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Donaciones" DROP COLUMN "DetalleAprobacion"`,
    );
  }
}
