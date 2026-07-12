// src/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Usuario } from './Users/Entities/usuario.entity';
import { SolicSacramento } from './Modules/Solicitudes/Entities/solic-sacramento.entity';
import { Evento } from './Modules/Eventos/Entities/evento.entity';
import { Donacion } from './Modules/Donaciones/Entities/donacion.entity';
import { Bautismo } from './Modules/RegistroSacramentos/Entities/bautismo.entity';
import { Comunion } from './Modules/RegistroSacramentos/Entities/comunion.entity';
import { Confirmacion } from './Modules/RegistroSacramentos/Entities/confirmacion.entity';
import { Matrimonio } from './Modules/RegistroSacramentos/Entities/matrimonio.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Usuario, SolicSacramento, Evento, Donacion, Bautismo, Comunion, Confirmacion, Matrimonio],
  migrations: ['src/migrations/*.ts'],
  ssl: { rejectUnauthorized: false },
});