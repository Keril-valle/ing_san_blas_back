import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivoEvento1788000000009 implements MigrationInterface {
  name = 'AddActivoEvento1788000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('evento', 'activo');

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "activo" boolean NOT NULL DEFAULT true`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('evento', 'activo')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "activo"`);
    }
  }
}
