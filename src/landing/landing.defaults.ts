/**
 * Fuente única de la configuración por defecto del landing.
 *
 * Se usa para:
 *  - el fallback de `findOne` cuando una sección todavía no tiene fila,
 *  - el botón "Restablecer" (por sección y global),
 *  - el snapshot que congelan las migraciones de seed.
 *
 * Ojo: esto NO reemplaza a las migraciones de seed (esas son un snapshot
 * congelado). Si se cambia un default acá, el reset ya lo aplica, pero las
 * migraciones ya ejecutadas no.
 */
import type {
  UpdateBautizosDto,
  UpdateContactoDto,
  UpdateDonacionesDto,
  UpdateHeroDto,
  UpdateHistoriaDto,
  UpdateHorariosDto,
  UpdateServiciosDto,
  UpdateSobreNosotrosDto,
} from './DTO/update-landing-section.dto';

export const LANDING_SECTION_KEYS = [
  'hero',
  'sobre-nosotros',
  'historia',
  'contacto',
  'horarios',
  'bautizos',
  'servicios',
  'donaciones',
] as const;

export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[number];

// imágenes por defecto ya alojadas en Cloudinary (antes vivían en el repo)
const IMG = {
  hero: 'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838080/landing/hero/default/imagen.webp',
  sobreNosotros:
    'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838081/landing/sobre-nosotros/default/imagen.jpg',
  historiaHeader:
    'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838081/landing/historia/default/encabezado.avif',
  historiaQuote:
    'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838082/landing/historia/default/cita.jpg',
  horarios:
    'https://res.cloudinary.com/rbrda5nv/image/upload/v1789838083/landing/horarios/default/imagen.jpg',
};

export const HERO_DEFAULT: UpdateHeroDto = {
  subtitle: 'Desde 1544',
  title: 'Firme en la',
  titleHighlight: 'Fe y Tradición',
  description:
    'Ubicada en el corazón de Nicoya, la Parroquia San Blas es testimonio vivo de nuestra historia y esperanza cristiana.',
  imageUrl: IMG.hero,
};

export const SOBRE_NOSOTROS_DEFAULT: UpdateSobreNosotrosDto = {
  eyebrow: 'Sobre Nosotros',
  title: 'Una parroquia que guarda la fe, la historia y la cercanía de Nicoya',
  lead: 'La Parroquia San Blas de Nicoya es un referente espiritual y cultural de Costa Rica. Su historia, su misión pastoral y su vocación de servicio siguen acompañando a una comunidad viva, hospitalaria y profundamente creyente.',
  cards: [
    {
      icono: '01',
      titulo: 'Raíz histórica',
      texto:
        'La Parroquia San Blas ha acompañado la vida espiritual de Nicoya desde sus orígenes, siendo parte esencial de la memoria religiosa y cultural de Costa Rica.',
    },
    {
      icono: '02',
      titulo: 'Identidad cultural',
      texto:
        'Su presencia ha contribuido a preservar tradiciones, celebraciones y expresiones de fe que fortalecen el sentido de pertenencia de la comunidad nicoyana.',
    },
    {
      icono: '03',
      titulo: 'Misión espiritual',
      texto:
        'Nuestra misión es anunciar el Evangelio, celebrar los sacramentos y sostener la fe del pueblo con una pastoral cercana, serena y comprometida.',
    },
    {
      icono: '04',
      titulo: 'Servicio a la comunidad',
      texto:
        'Acompañamos a niños, jóvenes, adultos mayores y familias con catequesis, formación y espacios de servicio que buscan unir fe y vida diaria.',
    },
  ],
  imageUrl: IMG.sobreNosotros,
};

export const HISTORIA_DEFAULT: UpdateHistoriaDto = {
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
  headerImageUrl: IMG.historiaHeader,
  quoteImageUrl: IMG.historiaQuote,
};

export const CONTACTO_DEFAULT: UpdateContactoDto = {
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
};

// valores del volante de la Santa Misa
export const HORARIOS_DEFAULT: UpdateHorariosDto = {
  title: 'Horarios',
  subtitle: 'de la Santa',
  titleHighlight: 'Misa',
  intro: 'Consulte los horarios de la Santa Misa en la Parroquia San Blas.',
  imageUrl: IMG.horarios,
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
};

export const BAUTIZOS_DEFAULT: UpdateBautizosDto = {
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
};

export const SERVICIOS_DEFAULT: UpdateServiciosDto = {
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
};

export const DONACIONES_DEFAULT: UpdateDonacionesDto = {
  title: 'Apoya a Nuestra Parroquia',
  intro:
    'Su donación sostiene la misión pastoral y el mantenimiento de la Parroquia San Blas de Nicoya.',
  sinpe: '8888-1234',
  cuentaBancaria: 'CR67015100012345678901',
  banco: 'Banco Nacional',
};

export const LANDING_DEFAULTS: Record<LandingSectionKey, object> = {
  hero: HERO_DEFAULT,
  'sobre-nosotros': SOBRE_NOSOTROS_DEFAULT,
  historia: HISTORIA_DEFAULT,
  contacto: CONTACTO_DEFAULT,
  horarios: HORARIOS_DEFAULT,
  bautizos: BAUTIZOS_DEFAULT,
  servicios: SERVICIOS_DEFAULT,
  donaciones: DONACIONES_DEFAULT,
};

// clon profundo del default pa que el reset nunca mute la constante original
export function clonarDefault(sectionKey: LandingSectionKey): object {
  return JSON.parse(JSON.stringify(LANDING_DEFAULTS[sectionKey])) as object;
}
