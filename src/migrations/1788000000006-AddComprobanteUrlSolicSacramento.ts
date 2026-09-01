import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComprobanteUrlSolicSacramento1788000000006 implements MigrationInterface {
  name = 'AddComprobanteUrlSolicSacramento1788000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'solic_sacramento',
      'comprobante_url',
    );

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" ADD "comprobante_url" character varying`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('solic_sacramento', 'comprobante_url')) {
      await queryRunner.query(
        `ALTER TABLE "solic_sacramento" DROP COLUMN "comprobante_url"`,
      );
    }
  }
}
