import { Usuario } from './Users/Entities/usuario.entity';
import { RecuperacionContrasena } from './Auth/Entities/recuperacion-contrasena.entity';
import { Rol } from './Users/Entities/rol.entity';
import { UsuarioRol } from './Users/Entities/usuario-rol.entity';
import { LandingSection } from './landing/Entities/landing-section.entity';
import { SolicSacramento } from './Modules/Solicitudes/Entities/solic-sacramento.entity';
import { HistorialRechazos } from './Modules/Solicitudes/Entities/historial-rechazos.entity';
import { Evento } from './Modules/Eventos/Entities/evento.entity';
import { Donacion } from './Modules/Donaciones/Entities/donacion.entity';
import { Bautismo } from './Modules/RegistroSacramentos/Entities/bautismo.entity';
import { Comunion } from './Modules/RegistroSacramentos/Entities/comunion.entity';
import { Confirmacion } from './Modules/RegistroSacramentos/Entities/confirmacion.entity';
import { Matrimonio } from './Modules/RegistroSacramentos/Entities/matrimonio.entity';
import { Sacramento } from './Modules/RegistroSacramentos/Entities/sacramento.entity';
import { PersonaSacramento } from './Modules/RegistroSacramentos/Entities/persona-sacramento.entity';
import { ParroquiaSacramento } from './Modules/RegistroSacramentos/Entities/parroquia-sacramento.entity';
import { PresbiteroSacramento } from './Modules/RegistroSacramentos/Entities/presbitero-sacramento.entity';
import { SacramentoRegistro } from './Modules/RegistroSacramentos/Entities/sacramento-registro.entity';
import { BautismoRegistro } from './Modules/RegistroSacramentos/Entities/bautismo-registro.entity';
import { BautismoAbuelo } from './Modules/RegistroSacramentos/Entities/bautismo-abuelo.entity';
import { ComunionRegistro } from './Modules/RegistroSacramentos/Entities/comunion-registro.entity';
import { ConfirmacionRegistro } from './Modules/RegistroSacramentos/Entities/confirmacion-registro.entity';
import { MatrimonioRegistro } from './Modules/RegistroSacramentos/Entities/matrimonio-registro.entity';
import { InscripcionCatequesis } from './Modules/Catequesis/Entities/inscripcion-catequesis.entity';
import { Catequizando } from './Modules/Catequesis/Entities/catequizando.entity';
import { BautismoCatequizando } from './Modules/Catequesis/Entities/bautismo-catequizando.entity';
import { AdecuacionCatequizando } from './Modules/Catequesis/Entities/adecuacion-catequizando.entity';
import { CondicionSaludCatequizando } from './Modules/Catequesis/Entities/condicion-salud-catequizando.entity';
import { MadreCatequizando } from './Modules/Catequesis/Entities/madre-catequizando.entity';
import { PagoInscripcionCatequesis } from './Modules/Catequesis/Entities/pago-inscripcion-catequesis.entity';
import { PersonaInscribeCatequesis } from './Modules/Catequesis/Entities/persona-inscribe-catequesis.entity';

/**
 * Registro único de entidades del backend.
 * Se usa tanto en `app.module.ts` (conexión runtime) como en `data-source.ts`
 * (CLI de migraciones) para que ambos escenarios siempre vean el mismo set de
 * entidades y no haya que mantener dos listas a mano.
 */
export const ENTIDADES = [
  Usuario,
  RecuperacionContrasena,
  Rol,
  UsuarioRol,
  LandingSection,
  SolicSacramento,
  HistorialRechazos,
  Evento,
  Donacion,
  Bautismo,
  Comunion,
  Confirmacion,
  Matrimonio,
  Sacramento,
  PersonaSacramento,
  ParroquiaSacramento,
  PresbiteroSacramento,
  SacramentoRegistro,
  BautismoRegistro,
  BautismoAbuelo,
  ComunionRegistro,
  ConfirmacionRegistro,
  MatrimonioRegistro,
  InscripcionCatequesis,
  Catequizando,
  BautismoCatequizando,
  AdecuacionCatequizando,
  CondicionSaludCatequizando,
  MadreCatequizando,
  PagoInscripcionCatequesis,
  PersonaInscribeCatequesis,
];
