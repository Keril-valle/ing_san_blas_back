import { MigrationInterface, QueryRunner } from 'typeorm';

export class LimitarDireccionExacta1788000000032 implements MigrationInterface {
  name = 'LimitarDireccionExacta1788000000032';

  // Baja la dirección exacta de text a varchar(150). LEFT recorta lo que se pase
  // del límite: solo había una dirección de prueba de 250 caracteres (solicitud 32).
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Catequizandos"
      ALTER COLUMN "DireccionExacta" TYPE varchar(150)
      USING LEFT("DireccionExacta", 150)
    `);
    await queryRunner.query(`
      ALTER TABLE "MadresCatequizando"
      ALTER COLUMN "DireccionExacta" TYPE varchar(150)
      USING LEFT("DireccionExacta", 150)
    `);
  }

  // Revertir amplía otra vez el límite: pasar de varchar(150) a text nunca pide truncar.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Catequizandos" ALTER COLUMN "DireccionExacta" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "MadresCatequizando" ALTER COLUMN "DireccionExacta" TYPE text`,
    );
  }
}
