import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPublicadoActivoEvento1788000000015 implements MigrationInterface {
  name = 'DropPublicadoActivoEvento1788000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('evento', 'activo')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "activo"`);
    }
    if (await queryRunner.hasColumn('evento', 'publicado')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "publicado"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('evento', 'publicado'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "publicado" boolean NOT NULL DEFAULT false`,
      );
    }
    if (!(await queryRunner.hasColumn('evento', 'activo'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "activo" boolean NOT NULL DEFAULT true`,
      );
    }
    if (await queryRunner.hasColumn('evento', 'estado')) {
      await queryRunner.query(`
        UPDATE "evento" SET
          "publicado" = CASE
            WHEN "estado"::text IN ('publicado', 'desactivado') THEN true
            ELSE false
          END,
          "activo" = CASE
            WHEN "estado"::text = 'desactivado' THEN false
            ELSE true
          END
      `);
    }
  }
}
