import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInscripcionCatequesisBautismo1788000000032
  implements MigrationInterface
{
  name = 'CreateInscripcionCatequesisBautismo1788000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inscripcion_catequesis_bautismo" (
        "id" SERIAL NOT NULL,
        "nombre" character varying(60) NOT NULL,
        "apellido1" character varying(60) NOT NULL,
        "apellido2" character varying(60),
        "fechaNacimiento" date NOT NULL,
        "cedula" character varying(20) NOT NULL,
        "telefono" character varying(20) NOT NULL,
        "estadoCivil" character varying(30) NOT NULL,
        "parroquiaOrigen" character varying(120) NOT NULL,
        "provincia" character varying(40) NOT NULL,
        "canton" character varying(80) NOT NULL,
        "distrito" character varying(80) NOT NULL,
        "barrio" character varying(80) NOT NULL,
        "condicion" character varying(40) NOT NULL,
        "estado" character varying(20) NOT NULL DEFAULT 'Pendiente',
        "observacionAdministrativa" text,
        "fechaInicioCatequesis" date,
        "fechaFinalizacionCatequesis" date,
        "responsableCertifica" character varying(160),
        "fechaSolicitud" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "fechaActualizacionEstado" TIMESTAMP WITH TIME ZONE,
        "revisadoPor" integer,
        CONSTRAINT "PK_inscripcion_catequesis_bautismo" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "inscripcion_catequesis_bautismo"`,
    );
  }
}
