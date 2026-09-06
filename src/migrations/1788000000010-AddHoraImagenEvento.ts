import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHoraImagenEvento1788000000010 implements MigrationInterface {
  name = 'AddHoraImagenEvento1788000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('evento', 'hora'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "hora" character varying`,
      );
    }

    if (!(await queryRunner.hasColumn('evento', 'imagenUrl'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "imagenUrl" character varying`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('evento', 'imagenUrl')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "imagenUrl"`);
    }

    if (await queryRunner.hasColumn('evento', 'hora')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "hora"`);
    }
  }
}
