import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCorreoPersonaInscribeCatequesis1788000000016
  implements MigrationInterface
{
  name = 'AddCorreoPersonaInscribeCatequesis1788000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PersonasInscribeCatequesis" ADD "Correo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PersonasInscribeCatequesis" DROP COLUMN "Correo"`,
    );
  }
}
