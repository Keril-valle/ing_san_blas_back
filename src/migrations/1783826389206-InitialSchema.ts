import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783826389206 implements MigrationInterface {
    name = 'InitialSchema1783826389206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."usuario_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "usuario" ("id" SERIAL NOT NULL, "nombre" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."usuario_role_enum" NOT NULL DEFAULT 'user', "refreshTokenHash" character varying, CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "solic_sacramento" ("id" SERIAL NOT NULL, "Nombre" character varying NOT NULL, "PrimerApellido" character varying NOT NULL, "SegundoApellido" character varying NOT NULL, "Cedula" integer NOT NULL, "Correo" character varying NOT NULL, "Telefono" integer NOT NULL, "TipoSacramento" character varying NOT NULL, "Motivo" character varying NOT NULL, "Estado" character varying NOT NULL DEFAULT 'pendiente', CONSTRAINT "PK_8160cfaef92fce31ede88605b29" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "evento" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "descripcion" text NOT NULL, "fechaInicio" character varying NOT NULL, "fechaFin" character varying, "lugar" character varying NOT NULL, "publicado" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ceb2e9607555230aee6aff546b0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "evento"`);
        await queryRunner.query(`DROP TABLE "solic_sacramento"`);
        await queryRunner.query(`DROP TABLE "usuario"`);
        await queryRunner.query(`DROP TYPE "public"."usuario_role_enum"`);
    }

}
