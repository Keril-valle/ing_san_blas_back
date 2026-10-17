import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInscripcionCica1788000000031 implements MigrationInterface {
  name = 'CreateInscripcionCica1788000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inscripcion_cica" (
        "id" SERIAL NOT NULL,
        "nombre" character varying(60) NOT NULL,
        "apellido1" character varying(60) NOT NULL,
        "apellido2" character varying(60),
        "fechaNacimiento" date NOT NULL,
        "cedula" character varying(20) NOT NULL,
        "nacionalidad" character varying(60) NOT NULL,
        "telefono" character varying(20) NOT NULL,
        "correo" character varying(120) NOT NULL,
        "estadoCivil" character varying(30) NOT NULL,
        "nombreConyuge" character varying(160),
        "necesitaBautizo" boolean NOT NULL DEFAULT false,
        "necesitaPrimeraComunion" boolean NOT NULL DEFAULT false,
        "necesitaConfirmacion" boolean NOT NULL DEFAULT false,
        "padreNombre" character varying(60) NOT NULL,
        "padreApellido1" character varying(60) NOT NULL,
        "padreApellido2" character varying(60),
        "madreNombre" character varying(60) NOT NULL,
        "madreApellido1" character varying(60) NOT NULL,
        "madreApellido2" character varying(60),
        "direccionHogar" character varying(250) NOT NULL,
        "esCatolico" boolean NOT NULL,
        "otraIglesia" character varying(120),
        "observacion" text,
        "estado" character varying(20) NOT NULL DEFAULT 'Pendiente',
        "observacionAdministrativa" text,
        "fechaSolicitud" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "fechaActualizacionEstado" TIMESTAMP WITH TIME ZONE,
        "revisadoPor" integer,
        CONSTRAINT "PK_inscripcion_cica" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inscripcion_cica"`);
  }
}
