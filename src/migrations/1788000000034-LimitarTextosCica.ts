import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNAS_25 = [
  'nombre',
  'apellido1',
  'apellido2',
  'nacionalidad',
  'conyugeNombre',
  'conyugeApellido1',
  'conyugeApellido2',
  'padreNombre',
  'padreApellido1',
  'padreApellido2',
  'madreNombre',
  'madreApellido1',
  'madreApellido2',
  'otraIglesia',
] as const;

export class LimitarTextosCica1788000000034 implements MigrationInterface {
  name = 'LimitarTextosCica1788000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const columna of COLUMNAS_25) {
      await queryRunner.query(
        `UPDATE "inscripcion_cica" SET "${columna}" = left("${columna}", 25) WHERE "${columna}" IS NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "inscripcion_cica" ALTER COLUMN "${columna}" TYPE character varying(25)`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ALTER COLUMN "direccionHogar" TYPE character varying(300)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "inscripcion_cica" SET "direccionHogar" = left("direccionHogar", 250)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_cica" ALTER COLUMN "direccionHogar" TYPE character varying(250)`,
    );
    for (const columna of [...COLUMNAS_25].reverse()) {
      const largo = columna === 'otraIglesia' ? 120 : 60;
      await queryRunner.query(
        `ALTER TABLE "inscripcion_cica" ALTER COLUMN "${columna}" TYPE character varying(${largo})`,
      );
    }
  }
}
