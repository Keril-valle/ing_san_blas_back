// src/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ENTIDADES } from './entities';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTIDADES,
  migrations: ['src/migrations/*.ts'],
  ssl: { rejectUnauthorized: false },
});
