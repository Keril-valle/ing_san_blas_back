import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRejectionFields1786941835437 implements MigrationInterface {
  name = 'AddRejectionFields1786941835437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ADD "MotivoRechazo" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ADD "DetalleRechazo" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ADD "RechazadoPor" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ADD "FechaRechazo" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" DROP COLUMN "FechaRechazo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" DROP COLUMN "RechazadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" DROP COLUMN "DetalleRechazo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" DROP COLUMN "MotivoRechazo"`,
    );
  }
}
