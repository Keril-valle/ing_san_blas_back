import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAdminToSecretario1788000000026 implements MigrationInterface {
  name = 'RenameAdminToSecretario1788000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "usuario"
      SET "role" = 'secretario'
      WHERE "role" = 'admin'
    `);
    await queryRunner.query(`
      UPDATE "rol"
      SET "clave" = 'secretario', "nombre" = 'Secretario'
      WHERE "clave" = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "usuario"
      SET "role" = 'admin'
      WHERE "role" = 'secretario'
    `);
    await queryRunner.query(`
      UPDATE "rol"
      SET "clave" = 'admin', "nombre" = 'Administrador'
      WHERE "clave" = 'secretario'
    `);
  }
}
