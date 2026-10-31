import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UnicidadMatriculasPendientes1793180000000 implements MigrationInterface {
  name = 'UnicidadMatriculasPendientes1793180000000';

  // No borramos solicitudes antiguas para poder crear los índices.
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tabla of [
      'inscripcion_cica',
      'inscripcion_catequesis_bautismo',
    ]) {
      const duplicados = (await queryRunner.query(
        `SELECT 1 FROM "${tabla}" WHERE "estado" = 'Pendiente' GROUP BY "cedula" HAVING COUNT(*) > 1 LIMIT 1`,
      )) as unknown[];
      if (duplicados.length)
        throw new Error(
          `Hay cédulas con solicitudes pendientes duplicadas en ${tabla}. Revisarlas antes de migrar; no se eliminó ningún dato.`,
        );
    }
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cica_cedula_pendiente" ON "inscripcion_cica" ("cedula") WHERE "estado" = 'Pendiente'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bautismo_cedula_pendiente" ON "inscripcion_catequesis_bautismo" ("cedula") WHERE "estado" = 'Pendiente'`,
    );
  }

  // El rollback solo quita restricciones, nunca las solicitudes.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UQ_bautismo_cedula_pendiente"');
    await queryRunner.query('DROP INDEX "UQ_cica_cedula_pendiente"');
  }
}
