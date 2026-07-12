import { MigrationInterface, QueryRunner } from "typeorm";

export class DonativosEntidad1783832188478 implements MigrationInterface {
    name = 'DonativosEntidad1783832188478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Donaciones" ("Id" SERIAL NOT NULL, "Fecha" TIMESTAMP WITH TIME ZONE NOT NULL, "Anonimo" boolean NOT NULL, "Nombre" character varying NOT NULL, "Correo" character varying NOT NULL, "Telefono" character varying, "Detalle" character varying NOT NULL, "Estado" character varying NOT NULL DEFAULT 'Pendiente', CONSTRAINT "PK_76ea81950c9af17673098efa79b" PRIMARY KEY ("Id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Donaciones"`);
    }

}
