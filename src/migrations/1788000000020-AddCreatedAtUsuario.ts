import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtUsuario1788000000020 implements MigrationInterface {
  name = 'AddCreatedAtUsuario1788000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('usuario', 'created_at'))) {
      await queryRunner.query(
        `ALTER TABLE "usuario" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('usuario', 'created_at')) {
      await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "created_at"`);
    }
  }
}
