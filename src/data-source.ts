// src/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Usuario } from './Users/Entities/usuario.entity';
import { SolicSacramento } from './Modules/Solicitudes/Entities/solic-sacramento.entity';
import { Evento } from './Modules/Eventos/Entities/evento.entity';
import { Donacion } from './Modules/Donaciones/Entities/donacion.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Usuario, SolicSacramento, Evento, Donacion],
  migrations: ['src/migrations/*.ts'],
  ssl: { rejectUnauthorized: false },
});