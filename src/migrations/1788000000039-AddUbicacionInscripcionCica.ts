import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUbicacionInscripcionCica1788000000039
  implements MigrationInterface
{
  name = 'AddUbicacionInscripcionCica1788000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ADD COLUMN IF NOT EXISTS "provincia" character varying(40) NOT NULL DEFAULT 'Guanacaste'
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ADD COLUMN IF NOT EXISTS "canton" character varying(50) NOT NULL DEFAULT 'Nicoya'
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ADD COLUMN IF NOT EXISTS "distrito" character varying(50) NOT NULL DEFAULT 'Nicoya'
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ALTER COLUMN "provincia" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ALTER COLUMN "canton" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica"
      ALTER COLUMN "distrito" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica" DROP COLUMN IF EXISTS "distrito"
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica" DROP COLUMN IF EXISTS "canton"
    `);
    await queryRunner.query(`
      ALTER TABLE "inscripcion_cica" DROP COLUMN IF EXISTS "provincia"
    `);
  }
}
