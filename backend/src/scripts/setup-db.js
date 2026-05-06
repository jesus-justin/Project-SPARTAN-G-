import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const parsedUrl = new URL(DATABASE_URL);
const targetDbName = parsedUrl.pathname.replace(/^\//, '');

if (!targetDbName) {
  throw new Error('DATABASE_URL must include a database name');
}

const adminUrl = new URL(DATABASE_URL);
adminUrl.pathname = '/postgres';

async function ensureDatabaseExists() {
  const adminClient = new Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();

  try {
    const checkResult = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDbName]);

    if (checkResult.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${targetDbName.replace(/"/g, '""')}"`);
    }
  } finally {
    await adminClient.end();
  }
}

async function runSchemaAndSeed() {
  const appClient = new Client({ connectionString: DATABASE_URL });
  await appClient.connect();

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    await appClient.query(schemaSql);

    const facilitatorEmail = 'ogc@batstateu.edu.ph';
    const facilitatorPassword = 'OGC@2025';
    const passwordHash = await bcrypt.hash(facilitatorPassword, 12);

    await appClient.query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, year_level, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         year_level = EXCLUDED.year_level,
         role = EXCLUDED.role`,
      [facilitatorEmail, passwordHash, 'OGC', 'Facilitator', null, 'facilitator']
    );
  } finally {
    await appClient.end();
  }
}

await ensureDatabaseExists();
await runSchemaAndSeed();

console.log('Database setup complete');
