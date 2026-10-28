import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivacionCuenta1788000000040 implements MigrationInterface {
  name = 'CreateActivacionCuenta1788000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activacion_cuenta" (
        "id" SERIAL NOT NULL,
        "usuarioId" integer NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activacion_cuenta" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_activacion_cuenta_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_activacion_cuenta_usuario" FOREIGN KEY ("usuarioId")
          REFERENCES "usuario"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_activacion_cuenta_usuarioId" ON "activacion_cuenta" ("usuarioId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "usuario" ALTER COLUMN "isActive" SET DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ALTER COLUMN "isActive" SET DEFAULT true`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "activacion_cuenta"`);
  }
}
