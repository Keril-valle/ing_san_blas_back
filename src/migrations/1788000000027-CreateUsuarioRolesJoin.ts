import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsuarioRolesJoin1788000000027 implements MigrationInterface {
  name = 'CreateUsuarioRolesJoin1788000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuario_roles" (
        "usuario_id" integer NOT NULL,
        "rol_id" integer NOT NULL,
        CONSTRAINT "PK_usuario_roles" PRIMARY KEY ("usuario_id", "rol_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_roles"
      ADD CONSTRAINT "FK_usuario_roles_usuario"
      FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_roles"
      ADD CONSTRAINT "FK_usuario_roles_rol"
      FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      INSERT INTO "usuario_roles" ("usuario_id", "rol_id")
      SELECT u."id", r."id"
      FROM "usuario" u
      JOIN "rol" r ON r."clave" = u."role"
      WHERE u."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM "usuario_roles" ur
        WHERE ur."usuario_id" = u."id" AND ur."rol_id" = r."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario_roles"`);
  }
}
