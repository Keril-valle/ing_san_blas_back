import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFilialesCelebracionSacramental1788000000008
  implements MigrationInterface
{
  name = 'SeedFilialesCelebracionSacramental1788000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE parroquia
      SET nombre = 'Centro San Blas'
      WHERE nombre = 'San Blas'
        AND NOT EXISTS (
          SELECT 1 FROM parroquia WHERE nombre = 'Centro San Blas'
        )
    `);

    await queryRunner.query(`
      INSERT INTO parroquia (nombre)
      SELECT f.nombre
      FROM (VALUES
        ('Río Grande'),
        ('Tierra Blanca'),
        ('Pedernal'),
        ('Casitas'),
        ('Curime'),
        ('Centro San Blas'),
        ('Los Ángeles')
      ) AS f(nombre)
      WHERE NOT EXISTS (
        SELECT 1 FROM parroquia p WHERE p.nombre = f.nombre
      )
    `);
  }

  public async down(): Promise<void> {
    // Las filiales pueden estar referenciadas por actas; no se revierten.
  }
}
