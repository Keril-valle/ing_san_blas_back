import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegistroSacramentosNormalizado1788000000005 implements MigrationInterface {
  name = 'CreateRegistroSacramentosNormalizado1788000000005';

  // Crea el esquema normalizado vacío sin tocar las tablas antiguas ni sus datos.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(
      `CREATE TYPE "tipo_sacramento_registro" AS ENUM ('bautismo', 'comunion', 'confirmacion', 'matrimonio')`,
    );
    await queryRunner.query(
      `CREATE TYPE "parentesco_abuelo_registro" AS ENUM ('abuelo_paterno', 'abuela_paterna', 'abuelo_materno', 'abuela_materna')`,
    );

    await queryRunner.query(`
      CREATE TABLE "persona" (
        "id_persona" SERIAL NOT NULL,
        "cedula" character varying(30),
        "nombre" character varying(100) NOT NULL,
        "primer_apellido" character varying(100) NOT NULL,
        "segundo_apellido" character varying(100),
        "nacionalidad" character varying(100),
        CONSTRAINT "PK_persona" PRIMARY KEY ("id_persona")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "parroquia" (
        "id_parroquia" SERIAL NOT NULL,
        "nombre" character varying(150) NOT NULL,
        "barrio" character varying(100),
        "distrito" character varying(100),
        "canton" character varying(100),
        "provincia" character varying(100),
        CONSTRAINT "PK_parroquia" PRIMARY KEY ("id_parroquia")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "presbitero" (
        "id_presbitero" SERIAL NOT NULL,
        "nombre" character varying(100) NOT NULL,
        "primer_apellido" character varying(100) NOT NULL,
        "segundo_apellido" character varying(100),
        CONSTRAINT "PK_presbitero" PRIMARY KEY ("id_presbitero")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sacramento" (
        "id_sacramento" SERIAL NOT NULL,
        "tipo_sacramento" "tipo_sacramento_registro" NOT NULL,
        "id_parroquia" integer NOT NULL,
        "id_presbitero" integer,
        "fecha_sacramento" date NOT NULL,
        "observaciones" text,
        "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sacramento" PRIMARY KEY ("id_sacramento"),
        CONSTRAINT "FK_sacramento_parroquia" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia" ("id_parroquia") ON DELETE RESTRICT,
        CONSTRAINT "FK_sacramento_presbitero" FOREIGN KEY ("id_presbitero") REFERENCES "presbitero" ("id_presbitero") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bautismo" (
        "id_sacramento" integer NOT NULL,
        "id_bautizado" integer NOT NULL,
        "id_padre" integer,
        "id_madre" integer,
        "id_padrino" integer,
        "id_madrina" integer,
        "id_declarante" integer,
        "fecha_nacimiento" date,
        "hora_nacimiento" time,
        "lugar_nacimiento" character varying(200),
        "reconocimiento_legal" character varying(200),
        "libro" character varying(100),
        "tomo" character varying(100),
        "folio" character varying(100),
        "asiento" character varying(100),
        "firma_parroco" character varying(200),
        CONSTRAINT "PK_bautismo" PRIMARY KEY ("id_sacramento"),
        CONSTRAINT "FK_bautismo_sacramento" FOREIGN KEY ("id_sacramento") REFERENCES "sacramento" ("id_sacramento") ON DELETE CASCADE,
        CONSTRAINT "FK_bautismo_bautizado" FOREIGN KEY ("id_bautizado") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT,
        CONSTRAINT "FK_bautismo_padre" FOREIGN KEY ("id_padre") REFERENCES "persona" ("id_persona") ON DELETE SET NULL,
        CONSTRAINT "FK_bautismo_madre" FOREIGN KEY ("id_madre") REFERENCES "persona" ("id_persona") ON DELETE SET NULL,
        CONSTRAINT "FK_bautismo_padrino" FOREIGN KEY ("id_padrino") REFERENCES "persona" ("id_persona") ON DELETE SET NULL,
        CONSTRAINT "FK_bautismo_madrina" FOREIGN KEY ("id_madrina") REFERENCES "persona" ("id_persona") ON DELETE SET NULL,
        CONSTRAINT "FK_bautismo_declarante" FOREIGN KEY ("id_declarante") REFERENCES "persona" ("id_persona") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bautismo_abuelo" (
        "id_bautismo" integer NOT NULL,
        "id_persona" integer NOT NULL,
        "parentesco" "parentesco_abuelo_registro" NOT NULL,
        CONSTRAINT "PK_bautismo_abuelo" PRIMARY KEY ("id_bautismo", "id_persona"),
        CONSTRAINT "UQ_bautismo_abuelo_parentesco" UNIQUE ("id_bautismo", "parentesco"),
        CONSTRAINT "FK_bautismo_abuelo_bautismo" FOREIGN KEY ("id_bautismo") REFERENCES "bautismo" ("id_sacramento") ON DELETE CASCADE,
        CONSTRAINT "FK_bautismo_abuelo_persona" FOREIGN KEY ("id_persona") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comunion" (
        "id_sacramento" integer NOT NULL,
        "id_persona" integer NOT NULL,
        CONSTRAINT "PK_comunion" PRIMARY KEY ("id_sacramento"),
        CONSTRAINT "FK_comunion_sacramento" FOREIGN KEY ("id_sacramento") REFERENCES "sacramento" ("id_sacramento") ON DELETE CASCADE,
        CONSTRAINT "FK_comunion_persona" FOREIGN KEY ("id_persona") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "confirmacion" (
        "id_sacramento" integer NOT NULL,
        "id_persona" integer NOT NULL,
        CONSTRAINT "PK_confirmacion" PRIMARY KEY ("id_sacramento"),
        CONSTRAINT "FK_confirmacion_sacramento" FOREIGN KEY ("id_sacramento") REFERENCES "sacramento" ("id_sacramento") ON DELETE CASCADE,
        CONSTRAINT "FK_confirmacion_persona" FOREIGN KEY ("id_persona") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "matrimonio" (
        "id_sacramento" integer NOT NULL,
        "id_contrayente1" integer NOT NULL,
        "id_contrayente2" integer NOT NULL,
        "libro" character varying(100),
        "tomo" character varying(100),
        "folio" character varying(100),
        "asiento" character varying(100),
        "firma_parroco" character varying(200),
        CONSTRAINT "PK_matrimonio" PRIMARY KEY ("id_sacramento"),
        CONSTRAINT "CHK_matrimonio_contrayentes_distintos" CHECK ("id_contrayente1" <> "id_contrayente2"),
        CONSTRAINT "FK_matrimonio_sacramento" FOREIGN KEY ("id_sacramento") REFERENCES "sacramento" ("id_sacramento") ON DELETE CASCADE,
        CONSTRAINT "FK_matrimonio_contrayente1" FOREIGN KEY ("id_contrayente1") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT,
        CONSTRAINT "FK_matrimonio_contrayente2" FOREIGN KEY ("id_contrayente2") REFERENCES "persona" ("id_persona") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_persona_cedula" ON "persona" (lower(trim("cedula"))) WHERE "cedula" IS NOT NULL AND trim("cedula") <> ''`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sacramento_fecha" ON "sacramento" ("fecha_sacramento")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sacramento_tipo_fecha" ON "sacramento" ("tipo_sacramento", "fecha_sacramento")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_persona_nombre_trgm" ON "persona" USING gin ((lower("nombre")) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_persona_primer_apellido_trgm" ON "persona" USING gin ((lower("primer_apellido")) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_persona_segundo_apellido_trgm" ON "persona" USING gin ((lower("segundo_apellido")) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bautismo_abuelo_persona" ON "bautismo_abuelo" ("id_persona")`,
    );

    await queryRunner.query(`
      CREATE FUNCTION "actualizar_sacramento_modificado"()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW."actualizado_en" = now();
        RETURN NEW;
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TRG_sacramento_actualizado"
      BEFORE UPDATE ON "sacramento"
      FOR EACH ROW
      EXECUTE FUNCTION "actualizar_sacramento_modificado"()
    `);
  }

  // Elimina únicamente el esquema nuevo, respetando el orden de sus dependencias.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TRG_sacramento_actualizado" ON "sacramento"`,
    );
    await queryRunner.query(
      `DROP FUNCTION "actualizar_sacramento_modificado"()`,
    );
    await queryRunner.query(`DROP INDEX "IDX_bautismo_abuelo_persona"`);
    await queryRunner.query(`DROP INDEX "IDX_persona_segundo_apellido_trgm"`);
    await queryRunner.query(`DROP INDEX "IDX_persona_primer_apellido_trgm"`);
    await queryRunner.query(`DROP INDEX "IDX_persona_nombre_trgm"`);
    await queryRunner.query(`DROP INDEX "IDX_sacramento_tipo_fecha"`);
    await queryRunner.query(`DROP INDEX "IDX_sacramento_fecha"`);
    await queryRunner.query(`DROP INDEX "UQ_persona_cedula"`);
    await queryRunner.query(`DROP TABLE "matrimonio"`);
    await queryRunner.query(`DROP TABLE "confirmacion"`);
    await queryRunner.query(`DROP TABLE "comunion"`);
    await queryRunner.query(`DROP TABLE "bautismo_abuelo"`);
    await queryRunner.query(`DROP TABLE "bautismo"`);
    await queryRunner.query(`DROP TABLE "sacramento"`);
    await queryRunner.query(`DROP TABLE "presbitero"`);
    await queryRunner.query(`DROP TABLE "parroquia"`);
    await queryRunner.query(`DROP TABLE "persona"`);
    await queryRunner.query(`DROP TYPE "parentesco_abuelo_registro"`);
    await queryRunner.query(`DROP TYPE "tipo_sacramento_registro"`);
  }
}
