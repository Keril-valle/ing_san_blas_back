import { MigrationInterface, QueryRunner } from 'typeorm';

const ROLES_SISTEMA: Array<[string, string, string]> = [
  ['catequista', 'Catequista', JSON.stringify(['panel', 'catequesis'])],
  ['gestor-eventos', 'Gestor de Eventos', JSON.stringify(['panel', 'eventos'])],
  [
    'gestor-donaciones',
    'Personal de Donaciones',
    JSON.stringify(['panel', 'donaciones']),
  ],
];

export class SeedPersonalRoles1788000000028 implements MigrationInterface {
  name = 'SeedPersonalRoles1788000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [clave, nombre, permisos] of ROLES_SISTEMA) {
      await queryRunner.query(
        `
        INSERT INTO "rol" ("clave", "nombre", "descripcion", "permisos", "es_sistema")
        VALUES ($1, $2, $3, $4::jsonb, true)
        ON CONFLICT ("clave") DO NOTHING
      `,
        [clave, nombre, '', permisos],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "rol"
      WHERE "clave" IN ('catequista', 'gestor-eventos', 'gestor-donaciones')
    `);
  }
}
