import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRechazoDonacion1788000000012 implements MigrationInterface {
  name = 'AddRechazoDonacion1788000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Donaciones" ADD "MotivoRechazo" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" ADD "DetalleRechazo" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" ADD "RechazadoPor" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" ADD "FechaRechazo" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Donaciones" DROP COLUMN "FechaRechazo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" DROP COLUMN "RechazadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" DROP COLUMN "DetalleRechazo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Donaciones" DROP COLUMN "MotivoRechazo"`,
    );
  }
}
