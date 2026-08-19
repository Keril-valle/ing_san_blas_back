import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormaEntregaSolicSacramento1788000000004 implements MigrationInterface {
  name = 'AddFormaEntregaSolicSacramento1788000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'solic_sacramento',
      'FormaEntrega',
    );

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" ADD "FormaEntrega" character varying(30) NOT NULL DEFAULT 'Digital'`,
      );
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ALTER COLUMN "FormaEntrega" SET DEFAULT 'Digital'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('solic_sacramento', 'FormaEntrega')) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" DROP COLUMN "FormaEntrega"`,
      );
    }
  }
}
