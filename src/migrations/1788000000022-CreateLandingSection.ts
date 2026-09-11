import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLandingSection1788000000022 implements MigrationInterface {
  name = 'CreateLandingSection1788000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "landing_section" (
        "id" SERIAL NOT NULL,
        "section_key" character varying NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_landing_section" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_landing_section_key" UNIQUE ("section_key")
      )
    `);

    await queryRunner.query(
      `
      INSERT INTO "landing_section" ("section_key", "data")
      VALUES (
        'hero',
        $1::jsonb
      )
      ON CONFLICT ("section_key") DO NOTHING
    `,
      [
        JSON.stringify({
          subtitle: 'Desde 1544',
          title: 'Firme en la',
          titleHighlight: 'Fe y Tradición',
          description:
            'Ubicada en el corazón de Nicoya, la Parroquia San Blas es testimonio vivo de nuestra historia y esperanza cristiana.',
        }),
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "landing_section"`);
  }
}
