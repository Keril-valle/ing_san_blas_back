import type { MigrationInterface, QueryRunner } from 'typeorm';

// Agrega el correo de contacto (para avisar al inscribirse y al aprobar/rechazar)
// y la columna de soft delete para no borrar físicamente las constancias.
export class AddCorreoSoftDeleteBautismo1793200000000
  implements MigrationInterface
{
  name = 'AddCorreoSoftDeleteBautismo1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" ADD "correo" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" ADD "borrado_en" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" DROP COLUMN "borrado_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" DROP COLUMN "correo"`,
    );
  }
}
