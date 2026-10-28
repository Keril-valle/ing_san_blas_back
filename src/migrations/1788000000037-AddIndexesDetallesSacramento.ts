import { MigrationInterface, QueryRunner } from 'typeorm';

// Índices sobre las columnas que los detalles usan para ubicar a una persona.
// En Postgres las llaves foráneas no crean índice automáticamente y las
// consultas de detalle filtran por esas columnas, lo que provoca escaneos
// secuenciales; se agregan de forma explícita.
export class AddIndexesDetallesSacramento1788000000037
  implements MigrationInterface
{
  name = 'AddIndexesDetallesSacramento1788000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_bautismo_bautizado" ON "bautismo" ("id_bautizado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comunion_persona" ON "comunion" ("id_persona")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_confirmacion_persona" ON "confirmacion" ("id_persona")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matrimonio_contrayente1" ON "matrimonio" ("id_contrayente1")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matrimonio_contrayente2" ON "matrimonio" ("id_contrayente2")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_matrimonio_contrayente2"`);
    await queryRunner.query(`DROP INDEX "IDX_matrimonio_contrayente1"`);
    await queryRunner.query(`DROP INDEX "IDX_confirmacion_persona"`);
    await queryRunner.query(`DROP INDEX "IDX_comunion_persona"`);
    await queryRunner.query(`DROP INDEX "IDX_bautismo_bautizado"`);
  }
}
