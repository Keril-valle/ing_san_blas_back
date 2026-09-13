import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelefonoPersonaInscribeCatequesis1788000000019 implements MigrationInterface {
  name = 'AddTelefonoPersonaInscribeCatequesis1788000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PersonasInscribeCatequesis" ADD "Telefono" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PersonasInscribeCatequesis" DROP COLUMN "Telefono"`,
    );
  }
}
