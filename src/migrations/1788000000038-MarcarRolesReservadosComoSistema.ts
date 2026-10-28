import { MigrationInterface, QueryRunner } from 'typeorm';

/** Roles de plataforma que deben quedar marcados como del sistema. */
const CLAVES_SISTEMA = [
  'admin',
  'user',
  'secretario',
  'catequista',
  'gestor-eventos',
  'gestor-donaciones',
];

export class MarcarRolesReservadosComoSistema1788000000038
  implements MigrationInterface
{
  name = 'MarcarRolesReservadosComoSistema1788000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      UPDATE "rol"
      SET "es_sistema" = true
      WHERE "clave" = ANY($1::text[])
        AND "es_sistema" = false
    `,
      [CLAVES_SISTEMA],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo se revierten los roles de personal que originalmente se sembraron
    // como sistema; admin/user/secretario deben seguir siendo del sistema.
    await queryRunner.query(`
      UPDATE "rol"
      SET "es_sistema" = false
      WHERE "clave" IN ('catequista', 'gestor-eventos', 'gestor-donaciones')
    `);
  }
}
