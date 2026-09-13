import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLAS = [
  'Catequizandos',
  'MadresCatequizando',
  'PersonasInscribeCatequesis',
] as const;

export class SplitApellidosCatequesis1788000000018 implements MigrationInterface {
  name = 'SplitApellidosCatequesis1788000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tabla of TABLAS) {
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD "PrimerApellido" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD "SegundoApellido" character varying`,
      );
      await queryRunner.query(
        `UPDATE "${tabla}"
         SET "PrimerApellido" = COALESCE(NULLIF(split_part(btrim(COALESCE("Apellidos", '')), ' ', 1), ''), 'Sin apellido'),
             "SegundoApellido" = NULLIF(btrim(regexp_replace(btrim(COALESCE("Apellidos", '')), '^[^[:space:]]+[[:space:]]*', '')), '')`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ALTER COLUMN "PrimerApellido" SET NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "${tabla}" DROP COLUMN "Apellidos"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tabla of TABLAS) {
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD "Apellidos" character varying`,
      );
      await queryRunner.query(
        `UPDATE "${tabla}"
         SET "Apellidos" = btrim(CONCAT("PrimerApellido", ' ', COALESCE("SegundoApellido", '')))`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ALTER COLUMN "Apellidos" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" DROP COLUMN "PrimerApellido"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${tabla}" DROP COLUMN "SegundoApellido"`,
      );
    }
  }
}
