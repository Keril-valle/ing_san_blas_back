import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSolicSacramentoIndexes1788000000001 implements MigrationInterface {
  name = 'AddSolicSacramentoIndexes1788000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_nombre" ON "solic_sacramento" ("Nombre")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_primer_apellido" ON "solic_sacramento" ("PrimerApellido")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_segundo_apellido" ON "solic_sacramento" ("SegundoApellido")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_cedula" ON "solic_sacramento" ("Cedula")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_estado" ON "solic_sacramento" ("Estado")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_solic_sacramento_tipo" ON "solic_sacramento" ("TipoSacramento")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_solic_sacramento_tipo"');
    await queryRunner.query('DROP INDEX "IDX_solic_sacramento_estado"');
    await queryRunner.query('DROP INDEX "IDX_solic_sacramento_cedula"');
    await queryRunner.query(
      'DROP INDEX "IDX_solic_sacramento_segundo_apellido"',
    );
    await queryRunner.query(
      'DROP INDEX "IDX_solic_sacramento_primer_apellido"',
    );
    await queryRunner.query('DROP INDEX "IDX_solic_sacramento_nombre"');
  }
}
