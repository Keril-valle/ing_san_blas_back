import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistroSacramentos1783835830858 implements MigrationInterface {
    name = 'RegistroSacramentos1783835830858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Bautismos" ("Id" SERIAL NOT NULL, "Nombre" character varying(100) NOT NULL, "Cedula" integer NOT NULL, "PrimerApellido" character varying(100) NOT NULL, "SegundoApellido" character varying(100) NOT NULL, "NombreParroquia" character varying(150) NOT NULL, "FechaBautismo" TIMESTAMP WITH TIME ZONE NOT NULL, "AnnioBautismo" integer NOT NULL, "Prebispero" character varying(100) NOT NULL, "FechaNacimiento" TIMESTAMP WITH TIME ZONE NOT NULL, "HoraNacimiento" interval NOT NULL, "NombreAbuelosPaternos" character varying(200) NOT NULL, "NombreAbuelosMaternos" character varying(200) NOT NULL, CONSTRAINT "PK_000a5e0fbc317681729bebc71f7" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Comuniones" ("Id" SERIAL NOT NULL, "Nombre" character varying(100) NOT NULL, "DiaComunion" character varying(10) NOT NULL, "MesComunion" character varying(20) NOT NULL, "AnnioComunion" integer NOT NULL, "LugarComunion" character varying(150) NOT NULL, CONSTRAINT "PK_f2529fddaffa510cf8aa4ae5149" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Confirmaciones" ("Id" SERIAL NOT NULL, "Nombre" character varying(100) NOT NULL, "DiaConfirmacion" character varying(10) NOT NULL, "MesConfirmacion" character varying(20) NOT NULL, "AnnioConfirmacion" integer NOT NULL, "LugarConfirmacion" character varying(150) NOT NULL, CONSTRAINT "PK_99bf00b09560892ef0f57875d22" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Matrimonios" ("Id" SERIAL NOT NULL, "NombreContrayente" character varying(100) NOT NULL, "NombreContrayente2" character varying(100) NOT NULL, "DiaMatrimonio" character varying(10) NOT NULL, "MesMatrimonio" character varying(20) NOT NULL, "AnnioMatrimonio" integer NOT NULL, "LugarMatrimonio" character varying(150) NOT NULL, "Tomo" integer NOT NULL, "Folio" integer NOT NULL, CONSTRAINT "PK_d670b81df395dd7f3201b3be5d0" PRIMARY KEY ("Id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Matrimonios"`);
        await queryRunner.query(`DROP TABLE "Confirmaciones"`);
        await queryRunner.query(`DROP TABLE "Comuniones"`);
        await queryRunner.query(`DROP TABLE "Bautismos"`);
    }

}
