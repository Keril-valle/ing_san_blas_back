import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMontoPagoInscripcionCatequesis1788000000017
  implements MigrationInterface
{
  name = 'DropMontoPagoInscripcionCatequesis1788000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PagosInscripcionCatequesis" DROP COLUMN "Monto"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PagosInscripcionCatequesis" ADD "Monto" numeric NOT NULL DEFAULT 5000`,
    );
  }
}
