import { MigrationInterface, QueryRunner } from 'typeorm';

export class LimitarDireccionCica1788000000035 implements MigrationInterface {
  name = 'LimitarDireccionCica1788000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "inscripcion_cica" SET "direccionHogar" = left("direccionHogar", 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ALTER COLUMN "direccionHogar" TYPE character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ALTER COLUMN "direccionHogar" TYPE character varying(300)`,
    );
  }
}
