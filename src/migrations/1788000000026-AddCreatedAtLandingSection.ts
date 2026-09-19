import { MigrationInterface, QueryRunner } from 'typeorm';

// agrega la fecha de creación a landing_section (pedida en la tarea #449)
export class AddCreatedAtLandingSection1788000000026 implements MigrationInterface {
  name = 'AddCreatedAtLandingSection1788000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_section"
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_section"
      DROP COLUMN IF EXISTS "created_at"
    `);
  }
}
