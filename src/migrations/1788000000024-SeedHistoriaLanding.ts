import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedHistoriaLanding1788000000024 implements MigrationInterface {
  name = 'SeedHistoriaLanding1788000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "landing_section" ("section_key", "data")
      VALUES (
        'historia',
        $1::jsonb
      )
      ON CONFLICT ("section_key") DO NOTHING
    `,
      [
        JSON.stringify({
          eyebrow: 'Raíces de Fe',
          subtitle: 'Un tesoro colonial en el corazón de Guanacaste',
          origenes:
            'La Parroquia de San Blas, ubicada en el majestuoso cantón de Nicoya, es más que una edificación religiosa; es un símbolo indeleble de la historia colonial de Costa Rica y de la profunda devoción que caracteriza a la región Chorotega. Con orígenes que se remontan al año 1544, esta iglesia se consolida como una de las parroquias más antiguas y valiosas del país.',
          restauraciones:
            'A lo largo de los siglos, estos muros han sido testigos silenciosos del paso del tiempo. Diversos eventos naturales han puesto a prueba la fortaleza del templo, motivando importantes labores de restauración que han reafirmado la perseverancia y fe inquebrantable de la comunidad nicoyana a través de las generaciones.',
          cita: '"Un espacio donde nuestra tradición ancestral se encuentra con la paz espiritual."',
          fachada:
            'Su inconfundible fachada, su armazón de cálidos tonos blancos y su imponente techo resguardan elementos invaluables que entrelazan la influencia indígena y española. Esta mezcla se respira en cada rincón, desde el campanario hasta los históricos retablos de su interior.',
          invitacion:
            'Hoy en día, la Parroquia San Blas mantiene sus puertas abiertas y su vocación firme. Invitamos a todos los feligreses y visitantes a caminar por sus naves, sentir el legado histórico que descansa bajo su techo colonial y acompañarnos en esta gran misión espiritual.',
          videoUrl: 'https://www.youtube.com/embed/KWFL_AS5Xlk',
        }),
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "landing_section" WHERE "section_key" = 'historia'`,
    );
  }
}
