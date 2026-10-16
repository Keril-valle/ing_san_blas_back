import { MigrationInterface, QueryRunner } from 'typeorm';

export class FechaSolicitudCatequesisADate1788000000037 implements MigrationInterface {
  name = 'FechaSolicitudCatequesisADate1788000000037';

  // Deja solo el día. La hora se pasa a Costa Rica antes de cortarla, así el día guardado es el mismo que ya se veía en el Excel.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "InscripcionesCatequesis"
      ALTER COLUMN "FechaSolicitud" TYPE date
      USING ("FechaSolicitud" AT TIME ZONE 'America/Costa_Rica')::date
    `);
  }

  // Vuelve a timestamp, pero la hora ya no existe: queda a las 00:00 de Costa Rica.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "InscripcionesCatequesis"
      ALTER COLUMN "FechaSolicitud" TYPE TIMESTAMP WITH TIME ZONE
      USING ("FechaSolicitud"::timestamp AT TIME ZONE 'America/Costa_Rica')
    `);
  }
}
