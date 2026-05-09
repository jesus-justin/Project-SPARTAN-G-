import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { pool } from '../config/db.js';

const execFileAsync = promisify(execFile);

const requiredColumns = ['college', 'year_level', 'program', 'sex'];
const requiredTables = [
  'users',
  'dass21_assessments',
  'phq9_responses',
  'gad7_responses',
  'esm_checkins',
  'ginhawa_content',
  'ogc_notifications',
  'cssrs_assessments',
];

async function runMigration() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migratePath = path.resolve(__dirname, './migrate-add-columns.js');
  const { stdout, stderr } = await execFileAsync(process.execPath, [migratePath], {
    cwd: path.resolve(__dirname, '..', '..'),
  });

  if (stdout && stdout.trim()) {
    console.log(stdout.trim());
  }
  if (stderr && stderr.trim()) {
    console.log(stderr.trim());
  }
}

async function verifyColumns() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'`
  );

  const existing = new Set((rows || []).map((r) => String(r.COLUMN_NAME).toLowerCase()));
  const missing = requiredColumns.filter((column) => !existing.has(column));

  if (missing.length > 0) {
    throw new Error(`Missing required users columns: ${missing.join(', ')}`);
  }
}

async function tableCount(tableName) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  return Number(rows?.[0]?.count || 0);
}

async function verifyTablesAndPrintReport() {
  for (const tableName of requiredTables) {
    const [existsRows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?`,
      [tableName]
    );

    if (!existsRows?.[0] || Number(existsRows[0].count) === 0) {
      throw new Error(`Missing required table: ${tableName}`);
    }

    const count = await tableCount(tableName);

    if (tableName === 'cssrs_assessments') {
      console.log(`⚠️ cssrs_assessments - DEPRECATED (${count} rows)`);
    } else if (tableName === 'users') {
      console.log(`✅ users table - OK (${count} rows)`);
    } else {
      console.log(`✅ ${tableName} - OK (${count} rows)`);
    }
  }
}

async function main() {
  try {
    await runMigration();
    await verifyColumns();
    await verifyTablesAndPrintReport();
  } catch (error) {
    console.error('Refresh failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
