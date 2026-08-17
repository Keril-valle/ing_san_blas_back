import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSacramentos1788000000000 implements MigrationInterface {
  name = 'CreateSacramentos1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Sacramentos" ("Id" SERIAL NOT NULL, "Cedula" character varying(30) NOT NULL, "PrimerNombre" character varying(100) NOT NULL, "SegundoNombre" character varying(100), "PrimerApellido" character varying(100) NOT NULL, "SegundoApellido" character varying(100) NOT NULL, "Libro" character varying(30) NOT NULL, "Folio" character varying(30) NOT NULL, "Asiento" character varying(30) NOT NULL, CONSTRAINT "PK_Sacramentos_Id" PRIMARY KEY ("Id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Sacramentos"`);
  }
}
