import { MigrationInterface, QueryRunner } from "typeorm";

export class Catequesis1783881076006 implements MigrationInterface {
    name = 'Catequesis1783881076006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Catequizandos" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "Nombre" character varying NOT NULL, "Apellidos" character varying NOT NULL, "FechaNacimiento" date NOT NULL, "DireccionExacta" text, CONSTRAINT "REL_2a7e95c00cc4f2ec585c6691d3" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_e84a442ad701b2f0d3b26b90e9e" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "BautismosCatequizando" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "Parroquia" character varying, "Fecha" date, "Tomo" character varying, "Folio" character varying, "Asiento" character varying, CONSTRAINT "REL_d18929221d5c700c590f6163e5" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_77ab4f6aa7832378890f205fe03" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "AdecuacionesCatequizando" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "RequiereAdecuacionCentroEducativo" boolean, "DescripcionAdecuacion" text, CONSTRAINT "REL_b5d6f7002fc91098f424c09d45" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_37744f0b528353dfc6b59827501" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "CondicionesSaludCatequizando" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "PortadorEnfermedadCronica" boolean, "DescripcionEnfermedad" text, CONSTRAINT "REL_4ee253da8082da5a1f180e56cf" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_8b5c93db9c62425f3463498cd44" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "MadresCatequizando" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "Nombre" character varying NOT NULL, "Apellidos" character varying NOT NULL, "DireccionExacta" text, "Ciudad" character varying, "Provincia" character varying, "Telefono" character varying NOT NULL, CONSTRAINT "REL_a4da7a008dd691301d80f04c21" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_c3879840b16305912f003b66e9b" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "PagosInscripcionCatequesis" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "MetodoPago" character varying NOT NULL, "NumeroComprobanteSinpe" character varying NOT NULL, "ComprobanteArchivo" character varying NOT NULL, "Monto" numeric NOT NULL, CONSTRAINT "REL_4e8cc8b2f35c0a2a73b1a17ef6" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_a53d0eca4b658fd90bea6692e5f" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "PersonasInscribeCatequesis" ("Id" SERIAL NOT NULL, "InscripcionCatequesisId" integer NOT NULL, "Nombre" character varying NOT NULL, "Apellidos" character varying NOT NULL, "Parentesco" character varying NOT NULL, CONSTRAINT "REL_072866ac8689af2bba8d31c3d2" UNIQUE ("InscripcionCatequesisId"), CONSTRAINT "PK_48f524032f6afab522270c2e38f" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "InscripcionesCatequesis" ("Id" SERIAL NOT NULL, "CentroCatequesis" character varying NOT NULL, "NivelAInscribirse" character varying NOT NULL, "Estado" character varying NOT NULL DEFAULT 'Pendiente', "FechaSolicitud" TIMESTAMP WITH TIME ZONE NOT NULL, "ObservacionAdministrativa" text, "FechaActualizacionEstado" TIMESTAMP WITH TIME ZONE, "FeBautismoArchivo" character varying NOT NULL, CONSTRAINT "PK_54d51ea06d863002151f49c3e02" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "Catequizandos" ADD CONSTRAINT "FK_2a7e95c00cc4f2ec585c6691d3e" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "BautismosCatequizando" ADD CONSTRAINT "FK_d18929221d5c700c590f6163e55" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AdecuacionesCatequizando" ADD CONSTRAINT "FK_b5d6f7002fc91098f424c09d459" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "CondicionesSaludCatequizando" ADD CONSTRAINT "FK_4ee253da8082da5a1f180e56cff" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "MadresCatequizando" ADD CONSTRAINT "FK_a4da7a008dd691301d80f04c21f" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "PagosInscripcionCatequesis" ADD CONSTRAINT "FK_4e8cc8b2f35c0a2a73b1a17ef67" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "PersonasInscribeCatequesis" ADD CONSTRAINT "FK_072866ac8689af2bba8d31c3d20" FOREIGN KEY ("InscripcionCatequesisId") REFERENCES "InscripcionesCatequesis"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "PersonasInscribeCatequesis" DROP CONSTRAINT "FK_072866ac8689af2bba8d31c3d20"`);
        await queryRunner.query(`ALTER TABLE "PagosInscripcionCatequesis" DROP CONSTRAINT "FK_4e8cc8b2f35c0a2a73b1a17ef67"`);
        await queryRunner.query(`ALTER TABLE "MadresCatequizando" DROP CONSTRAINT "FK_a4da7a008dd691301d80f04c21f"`);
        await queryRunner.query(`ALTER TABLE "CondicionesSaludCatequizando" DROP CONSTRAINT "FK_4ee253da8082da5a1f180e56cff"`);
        await queryRunner.query(`ALTER TABLE "AdecuacionesCatequizando" DROP CONSTRAINT "FK_b5d6f7002fc91098f424c09d459"`);
        await queryRunner.query(`ALTER TABLE "BautismosCatequizando" DROP CONSTRAINT "FK_d18929221d5c700c590f6163e55"`);
        await queryRunner.query(`ALTER TABLE "Catequizandos" DROP CONSTRAINT "FK_2a7e95c00cc4f2ec585c6691d3e"`);
        await queryRunner.query(`DROP TABLE "InscripcionesCatequesis"`);
        await queryRunner.query(`DROP TABLE "PersonasInscribeCatequesis"`);
        await queryRunner.query(`DROP TABLE "PagosInscripcionCatequesis"`);
        await queryRunner.query(`DROP TABLE "MadresCatequizando"`);
        await queryRunner.query(`DROP TABLE "CondicionesSaludCatequizando"`);
        await queryRunner.query(`DROP TABLE "AdecuacionesCatequizando"`);
        await queryRunner.query(`DROP TABLE "BautismosCatequizando"`);
        await queryRunner.query(`DROP TABLE "Catequizandos"`);
    }

}

