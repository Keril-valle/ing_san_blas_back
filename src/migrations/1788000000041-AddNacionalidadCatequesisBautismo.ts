import { MigrationInterface, QueryRunner } from 'typeorm';

// La nacionalidad es opcional en la inscripción de catequesis para el bautismo:
// con cédula nacional nace "Costarricense" y con extranjera queda libre.
export class AddNacionalidadCatequesisBautismo1788000000041
  implements MigrationInterface
{
  name = 'AddNacionalidadCatequesisBautismo1788000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" ADD "nacionalidad" character varying(25)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_catequesis_bautismo" DROP COLUMN "nacionalidad"`,
    );
  }
}
