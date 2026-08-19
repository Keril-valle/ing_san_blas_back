import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeSolicSacramentoSearch1788000000003 implements MigrationInterface {
  name = 'OptimizeSolicSacramentoSearch1788000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await queryRunner.query(
      `CREATE INDEX "IDX_solic_sacramento_nombre_completo_trgm"
       ON "solic_sacramento" USING gin
       (("Nombre" || ' ' || "PrimerApellido" || ' ' || coalesce("SegundoApellido", '')) gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_solic_sacramento_nombre_completo_trgm"',
    );
  }
}
