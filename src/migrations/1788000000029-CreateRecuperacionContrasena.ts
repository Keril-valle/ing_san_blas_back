import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecuperacionContrasena1788000000029
  implements MigrationInterface
{
  name = 'CreateRecuperacionContrasena1788000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('usuario', 'passwordChangedAt'))) {
      await queryRunner.query(
        `ALTER TABLE "usuario" ADD "passwordChangedAt" TIMESTAMP WITH TIME ZONE`,
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recuperacion_contrasena" (
        "id" SERIAL NOT NULL,
        "usuarioId" integer NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recuperacion_contrasena" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_recuperacion_contrasena_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_recuperacion_contrasena_usuario" FOREIGN KEY ("usuarioId")
          REFERENCES "usuario"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_recuperacion_contrasena_usuarioId" ON "recuperacion_contrasena" ("usuarioId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "recuperacion_contrasena"`);
    if (await queryRunner.hasColumn('usuario', 'passwordChangedAt')) {
      await queryRunner.query(
        `ALTER TABLE "usuario" DROP COLUMN "passwordChangedAt"`,
      );
    }
  }
}
