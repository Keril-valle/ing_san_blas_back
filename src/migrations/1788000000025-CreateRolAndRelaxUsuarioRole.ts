import { MigrationInterface, QueryRunner } from 'typeorm';

const PERMISOS_ADMIN = JSON.stringify([
  'panel',
  'usuarios',
  'landing',
  'eventos',
  'donaciones',
  'catequesis',
  'constancias',
  'sacramentos',
]);

export class CreateRolAndRelaxUsuarioRole1788000000025 implements MigrationInterface {
  name = 'CreateRolAndRelaxUsuarioRole1788000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rol" (
        "id" SERIAL NOT NULL,
        "clave" character varying(40) NOT NULL,
        "nombre" character varying(80) NOT NULL,
        "descripcion" character varying(400) NOT NULL DEFAULT '',
        "permisos" jsonb NOT NULL DEFAULT '[]',
        "es_sistema" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rol_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rol_clave" UNIQUE ("clave")
      )
    `);

    await queryRunner.query(
      `
      INSERT INTO "rol" ("clave", "nombre", "descripcion", "permisos", "es_sistema")
      VALUES
        (
          'admin',
          'Administrador',
          'Acceso completo al panel. Puede administrar cuentas, contenido del sitio y trámites parroquiales.',
          $1::jsonb,
          true
        ),
        (
          'user',
          'Usuario',
          'Cuenta de feligrés o colaborador. Accede al sitio público y a trámites en línea, sin el panel administrativo.',
          '[]'::jsonb,
          true
        )
      ON CONFLICT ("clave") DO NOTHING
    `,
      [PERMISOS_ADMIN],
    );

    await queryRunner.query(`
      ALTER TABLE "usuario" ALTER COLUMN "role" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario" ALTER COLUMN "role" TYPE character varying(40) USING "role"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario" ALTER COLUMN "role" SET DEFAULT 'user'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_role_enum') THEN
          DROP TYPE "usuario_role_enum";
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "usuario_role_enum" AS ENUM ('admin', 'user')
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario" ALTER COLUMN "role" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario"
      ALTER COLUMN "role" TYPE "usuario_role_enum"
      USING CASE
        WHEN "role" = 'admin' THEN 'admin'::usuario_role_enum
        ELSE 'user'::usuario_role_enum
      END
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario" ALTER COLUMN "role" SET DEFAULT 'user'
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "rol"`);
  }
}
