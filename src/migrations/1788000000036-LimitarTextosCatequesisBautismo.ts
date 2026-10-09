import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNAS_25 = [
  'nombre',
  'apellido1',
  'apellido2',
  'parroquiaOrigen',
  'canton',
  'distrito',
  'barrio',
  'responsableCertifica',
] as const;

export class LimitarTextosCatequesisBautismo1788000000036
  implements MigrationInterface
{
  name = 'LimitarTextosCatequesisBautismo1788000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const columna of COLUMNAS_25) {
      await queryRunner.query(
        `UPDATE "inscripcion_catequesis_bautismo" SET "${columna}" = left("${columna}", 25) WHERE "${columna}" IS NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "inscripcion_catequesis_bautismo" ALTER COLUMN "${columna}" TYPE character varying(25)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const largos: Record<(typeof COLUMNAS_25)[number], number> = {
      nombre: 60,
      apellido1: 60,
      apellido2: 60,
      parroquiaOrigen: 120,
      canton: 80,
      distrito: 80,
      barrio: 80,
      responsableCertifica: 160,
    };
    for (const columna of [...COLUMNAS_25].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "inscripcion_catequesis_bautismo" ALTER COLUMN "${columna}" TYPE character varying(${largos[columna]})`,
      );
    }
  }
}
