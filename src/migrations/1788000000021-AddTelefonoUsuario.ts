import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelefonoUsuario1788000000021 implements MigrationInterface {
  name = 'AddTelefonoUsuario1788000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('usuario', 'telefono'))) {
      await queryRunner.query(
        `ALTER TABLE "usuario" ADD "telefono" character varying`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('usuario', 'telefono')) {
      await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "telefono"`);
    }
  }
}
