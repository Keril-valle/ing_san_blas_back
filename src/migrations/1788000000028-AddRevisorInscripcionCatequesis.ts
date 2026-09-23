import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevisorInscripcionCatequesis1788000000028 implements MigrationInterface {
  name = 'AddRevisorInscripcionCatequesis1788000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      !(await queryRunner.hasColumn('InscripcionesCatequesis', 'RevisadoPor'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "InscripcionesCatequesis" ADD "RevisadoPor" integer`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('InscripcionesCatequesis', 'RevisadoPor')) {
      await queryRunner.query(
        `ALTER TABLE "InscripcionesCatequesis" DROP COLUMN "RevisadoPor"`,
      );
    }
  }
}
