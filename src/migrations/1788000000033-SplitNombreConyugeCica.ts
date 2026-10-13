import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitNombreConyugeCica1788000000033 implements MigrationInterface {
  name = 'SplitNombreConyugeCica1788000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ADD "conyugeNombre" character varying(60)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ADD "conyugeApellido1" character varying(60)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ADD "conyugeApellido2" character varying(60)`,
    );
    await queryRunner.query(`
      UPDATE "inscripcion_cica"
      SET "conyugeNombre" = NULLIF(left(btrim(COALESCE("nombreConyuge", '')), 60), '')
      WHERE "nombreConyuge" IS NOT NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" DROP COLUMN "nombreConyuge"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ADD "nombreConyuge" character varying(160)`,
    );
    await queryRunner.query(`
      UPDATE "inscripcion_cica"
      SET "nombreConyuge" = NULLIF(
        btrim(CONCAT_WS(' ', "conyugeNombre", "conyugeApellido1", "conyugeApellido2")),
        ''
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" DROP COLUMN "conyugeApellido2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" DROP COLUMN "conyugeApellido1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" DROP COLUMN "conyugeNombre"`,
    );
  }
}
