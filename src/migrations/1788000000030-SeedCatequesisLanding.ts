import { MigrationInterface, QueryRunner } from 'typeorm';

// seed de la sección de catequesis (SINPE del formulario + PDF de lineamientos)
// snapshot congelado: si cambia un default en código, el reset ya lo aplica
export class SeedCatequesisLanding1788000000030 implements MigrationInterface {
  name = 'SeedCatequesisLanding1788000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "landing_section" ("section_key", "data")
      VALUES ($1, $2::jsonb)
      ON CONFLICT ("section_key") DO NOTHING
    `,
      [
        'catequesis',
        JSON.stringify({
          sinpe: '8878-3025',
          lineamientosUrl: '/lineamientos-catequesis-24-25.pdf',
        }),
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "landing_section"
      WHERE "section_key" = 'catequesis'
    `);
  }
}
