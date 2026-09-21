import { MigrationInterface, QueryRunner } from 'typeorm';

// seed de las secciones que faltaban (contacto, horarios, bautizos, servicios, donaciones)
// snapshot congelado: si cambia un default en código, el reset ya lo aplica
export class SeedSeccionesFaltantesLanding1788000000027 implements MigrationInterface {
  name = 'SeedSeccionesFaltantesLanding1788000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const secciones: Array<{ key: string; data: object }> = [
      {
        key: 'contacto',
        data: {
          eyebrow: 'San Blas, Nicoya',
          title: 'Contáctenos',
          intro:
            'Estamos a su disposición para consultas pastorales, trámites parroquiales e información sobre nuestras actividades.',
          telefono: '+506 2685-3540',
          correo: 'parroquiasanblas@gmail.com',
          ubicacion: 'Nicoya, Guanacaste, Costa Rica',
          horariosAtencion: [
            'Lunes: 8:00 a.m. a 12:00 m.d.',
            'Martes: 8:00 a.m. a 12:00 m.d. y 2:00 p.m. a 5:00 p.m.',
            'Miércoles: Cerrado',
            'Jueves a Viernes: 8:00 a.m. a 12:00 m.d. y 2:00 p.m. a 5:00 p.m.',
            'Sábados: 8:00 a.m. a 12:00 m.d.',
          ],
          mapaUrl:
            'https://maps.google.com/maps?q=Parroquia%20San%20Blas,%20Nicoya,%20Guanacaste&t=&z=16&ie=UTF8&iwloc=&output=embed',
        },
      },
      {
        key: 'horarios',
        data: {
          title: 'Horarios',
          subtitle: 'de la Santa',
          titleHighlight: 'Misa',
          intro:
            'Consulte los horarios de la Santa Misa en la Parroquia San Blas.',
          bloques: [
            {
              titulo: 'Entre semana',
              filas: [
                { dia: 'Lunes - Martes - Miércoles', horas: ['05:00 PM'] },
                {
                  dia: 'Jueves',
                  horas: ['Adoración: 04:00 PM', 'Santa Misa: 05:00 PM'],
                },
                { dia: 'Viernes', horas: ['05:00 PM'] },
                { dia: 'Sábado', horas: ['05:00 PM'] },
              ],
            },
            {
              titulo: 'Misa dominical',
              filas: [
                {
                  dia: 'Domingo',
                  horas: ['07:00 AM', '08:00 AM', '10:30 AM', '05:00 PM'],
                },
              ],
            },
          ],
        },
      },
      {
        key: 'bautizos',
        data: {
          title: 'Información de Bautizos',
          intro:
            'El bautismo es el primer sacramento de la iniciación cristiana. Para bautizar en la Parroquia San Blas, por favor tome en cuenta la siguiente información.',
          requisitos: [
            'Copia de la cédula de los padres o pasaporte si son extranjeros.',
            'Copia de la cédula de los padrinos.',
            'Comprobante de las charlas de preparación al bautismo.',
            'Certificado de nacimiento del niño/a.',
          ],
          charlas:
            'Las charlas se imparten los segundos martes de cada mes de forma presencial en el salón parroquial. Es indispensable presentar el comprobante para la programación del sacramento.',
          solicitud:
            'Para solicitar o programar un bautizo, puede acercarse a la oficina parroquial con los documentos requeridos o enviarlos a través de nuestro apartado de Solicitudes de Sacramentos.',
        },
      },
      {
        key: 'servicios',
        data: {
          eyebrow: 'Guías y Sacramentos',
          title: 'Servicios Ofrecidos',
          intro:
            'Acompañamiento y trámites espirituales administrados por la Parroquia San Blas.',
          items: [
            {
              title: 'Inscripción a Catequesis',
              description:
                'Inicie la formación en la fe y preparación sacramental para niños y jóvenes.',
              imageUrl:
                'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838128/landing/servicios/default/catequesis.jpg',
              category: 'Formación de Fe',
              buttonLabel: 'Iniciar Inscripción',
              linkTo: '/solicitudes-catequesis',
            },
            {
              title: 'Solicitud de Constancia',
              description:
                'Solicite constancias de Bautismo, Comunión, Confirmación o Matrimonio.',
              imageUrl:
                'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838129/landing/servicios/default/constancia.jpg',
              category: 'Archivo Parroquial',
              buttonLabel: 'Solicitar Constancia',
              linkTo: '/solicitudes-sacramentos',
            },
            {
              title: 'Preparación Bautizos',
              description:
                'Conozca los requisitos, charlas prebautismales y fechas disponibles para bautizos.',
              imageUrl:
                'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838146/landing/servicios/default/bautismo.jpg',
              category: 'Sacramentos',
              buttonLabel: 'Ver Más Información',
              modalDetails: {
                subtitle: 'Sacramento de Iniciación Cristiana',
                description:
                  'El bautismo incorpora a la persona a la Iglesia y la hace renacer como hijo de Dios.',
                schedule:
                  'Sábados del mes a las 10:00 a. m., con coordinación previa en la oficina parroquial.',
                requirements: [
                  'Copia del certificado de nacimiento.',
                  'Copia de cédula de ambos padres.',
                  'Copia de cédula de los padrinos.',
                  'Constancia de charla prebautismal.',
                ],
                contact: 'Oficina Parroquial San Blas. Teléfono: 2685-5010.',
              },
            },
            {
              title: 'Sacramento de Matrimonio',
              description:
                'Información para apertura de expediente matrimonial, charlas y coordinación de fechas.',
              imageUrl:
                'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838147/landing/servicios/default/matrimonios.jpg',
              category: 'Ministerio Familiar',
              buttonLabel: 'Ver Más Información',
              modalDetails: {
                subtitle: 'Compromiso de Amor ante el Altar',
                description:
                  'La parroquia brinda acompañamiento y guía para el proceso matrimonial.',
                schedule:
                  'Fechas a coordinar con la oficina parroquial según disponibilidad del templo.',
                requirements: [
                  'Iniciar el trámite con anticipación.',
                  'Certificados de bautismo recientes.',
                  'Copia de cédula de los contrayentes.',
                  'Asistencia a charlas matrimoniales.',
                ],
                contact: 'Oficina Parroquial San Blas. Teléfono: 2685-5010.',
              },
            },
            {
              title: 'Retiros Espirituales',
              description:
                'Jornadas de oración, reflexión y crecimiento espiritual para la comunidad parroquial.',
              imageUrl:
                'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838131/landing/servicios/default/retiro.jpg',
              category: 'Vida Interior',
              buttonLabel: 'Ver Más Información',
              modalDetails: {
                subtitle: 'Espacios de Silencio y Encuentro',
                description:
                  'Los retiros espirituales permiten fortalecer la vida de fe, la oración y la convivencia comunitaria.',
                schedule: 'Según calendario parroquial y avisos oficiales.',
                requirements: [
                  'Inscripción previa.',
                  'Disponibilidad para participar en la jornada completa.',
                  'Seguir las indicaciones del equipo organizador.',
                ],
                contact: 'Consultar en la oficina parroquial.',
              },
            },
          ],
        },
      },
      {
        key: 'donaciones',
        data: {
          title: 'Apoya a Nuestra Parroquia',
          intro:
            'Su donación sostiene la misión pastoral y el mantenimiento de la Parroquia San Blas de Nicoya.',
          sinpe: '8888-1234',
          cuentaBancaria: 'CR67015100012345678901',
          banco: 'Banco Nacional',
        },
      },
    ];

    for (const seccion of secciones) {
      await queryRunner.query(
        `
        INSERT INTO "landing_section" ("section_key", "data")
        VALUES ($1, $2::jsonb)
        ON CONFLICT ("section_key") DO NOTHING
      `,
        [seccion.key, JSON.stringify(seccion.data)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "landing_section"
      WHERE "section_key" IN ('contacto', 'horarios', 'bautizos', 'servicios', 'donaciones')
    `);
  }
}
