import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistorialRechazos1787029480658 implements MigrationInterface {
  name = 'AddHistorialRechazos1787029480658';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "historial_rechazos" ("id" SERIAL NOT NULL, "solicitud_id" integer NOT NULL, "usuario_id" integer NOT NULL, "motivo" character varying NOT NULL, "detalle" character varying, "creado_en" TIMESTAMP NOT NULL, CONSTRAINT "PK_ea1cd13c8b64af67cfbd44b32f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ALTER COLUMN "Estado" SET DEFAULT 'Pendiente'`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_rechazos" ADD CONSTRAINT "FK_f7fabe718e33bf7b3b398855d53" FOREIGN KEY ("solicitud_id") REFERENCES "solic_sacramento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_rechazos" ADD CONSTRAINT "FK_964094414daea3f143731b50912" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "historial_rechazos" DROP CONSTRAINT "FK_964094414daea3f143731b50912"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_rechazos" DROP CONSTRAINT "FK_f7fabe718e33bf7b3b398855d53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solic_sacramento" ALTER COLUMN "Estado" SET DEFAULT 'pendiente'`,
    );
    await queryRunner.query(`DROP TABLE "historial_rechazos"`);
  }
}
