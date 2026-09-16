import { MigrationInterface, QueryRunner } from 'typeorm';

const ENUM_TYPE = 'evento_estado_enum';

export class AddEstadoEvento1788000000012 implements MigrationInterface {
  name = 'AddEstadoEvento1788000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const enumExists = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = '${ENUM_TYPE}'`,
    )) as Array<{ '?column?': number }>;
    if (enumExists.length === 0) {
      await queryRunner.query(
        `CREATE TYPE "${ENUM_TYPE}" AS ENUM ('borrador', 'publicado', 'desactivado')`,
      );
    }

    if (!(await queryRunner.hasColumn('evento', 'estado'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "estado" "${ENUM_TYPE}" NOT NULL DEFAULT 'borrador'`,
      );
    }

    const hasLegacyColumns = await queryRunner.hasColumn('evento', 'publicado');
    if (hasLegacyColumns) {
      await queryRunner.query(
        `UPDATE "evento" SET "estado" = 'publicado' WHERE "publicado" = true AND "activo" = true`,
      );
      await queryRunner.query(
        `UPDATE "evento" SET "estado" = 'desactivado' WHERE "publicado" = true AND "activo" = false`,
      );

      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "publicado"`);
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "activo"`);
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
      await queryRunner.query(
        `UPDATE "evento" SET "publicado" = true WHERE "estado" IN ('publicado', 'desactivado')`,
      );
      await queryRunner.query(
        `UPDATE "evento" SET "activo" = false WHERE "estado" = 'desactivado'`,
      );
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "estado"`);
    }

    const enumExists = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = '${ENUM_TYPE}'`,
    )) as Array<{ '?column?': number }>;
    if (enumExists.length > 0) {
      await queryRunner.query(`DROP TYPE "${ENUM_TYPE}"`);
    }
  }
}
