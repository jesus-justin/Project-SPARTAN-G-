import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || typeof DB_NAME === 'undefined') {
  throw new Error('Missing required DB environment variables');
}

async function ensureDatabaseExists() {
  const adminConn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD || undefined,
    multipleStatements: true,
  });

  try {
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await adminConn.end();
  }
}

async function runSchemaAndSeed() {
  const pool = await mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD || undefined,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    await pool.query(schemaSql);

    const facilitatorEmail = 'ogc@batstateu.edu.ph';
    const facilitatorPassword = 'OGC@2025';
    const passwordHash = await bcrypt.hash(facilitatorPassword, 12);

    await pool.query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, year_level, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         year_level = VALUES(year_level),
         role = VALUES(role)`,
      [facilitatorEmail, passwordHash, 'OGC', 'Facilitator', null, 'facilitator']
    );
  } finally {
    await pool.end();
  }
}

(async () => {
  await ensureDatabaseExists();
  await runSchemaAndSeed();
  console.log('Database setup complete');
})();
