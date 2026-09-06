import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtEvento1788000000011 implements MigrationInterface {
  name = 'AddCreatedAtEvento1788000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('evento', 'created_at'))) {
      await queryRunner.query(
        `ALTER TABLE "evento" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('evento', 'created_at')) {
      await queryRunner.query(`ALTER TABLE "evento" DROP COLUMN "created_at"`);
    }
  }
}
