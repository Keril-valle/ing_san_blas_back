import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParroquiaSolicSacramento1788000000028
  implements MigrationInterface
{
  name = 'AddParroquiaSolicSacramento1788000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'solic_sacramento',
      'Parroquia',
    );

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" ADD "Parroquia" character varying(100) NOT NULL DEFAULT ''`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('solic_sacramento', 'Parroquia')) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" DROP COLUMN "Parroquia"`,
      );
    }
  }
}
