require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const result = await client.query('SELECT "email" FROM "usuario" WHERE "email" LIKE $1 AND "role" = $2 ORDER BY "id" DESC LIMIT 1', ['validacion-%@test.local', 'admin']);
  console.log(result.rows[0]?.email ?? 'none');
  await client.end();
})().catch(async (error) => { console.error(error.message); await client.end(); process.exitCode = 1; });
