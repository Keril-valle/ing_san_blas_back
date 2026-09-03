import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFechaArchivoSolicSacramento1788000000007 implements MigrationInterface {
  name = 'AddFechaArchivoSolicSacramento1788000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'solic_sacramento',
      'FechaArchivo',
    );

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" ADD "FechaArchivo" TIMESTAMP`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('solic_sacramento', 'FechaArchivo')) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" DROP COLUMN "FechaArchivo"`,
      );
    }
  }
}
