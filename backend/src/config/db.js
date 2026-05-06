import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function healthcheckDb() {
  const result = await query('SELECT NOW() as now');
  return result.rows[0];
}
