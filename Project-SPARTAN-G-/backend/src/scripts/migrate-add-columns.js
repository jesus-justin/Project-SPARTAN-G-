import { pool } from '../config/db.js';

const requiredColumns = [
  { name: 'college', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(100) DEFAULT NULL' },
  { name: 'year_level', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level INT DEFAULT NULL' },
  { name: 'program', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS program VARCHAR(100) DEFAULT NULL' },
  { name: 'sex', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS sex CHAR(1) DEFAULT NULL' },
];

async function columnExists(columnName) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = ?`,
    [columnName]
  );

  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  try {
    for (const column of requiredColumns) {
      const exists = await columnExists(column.name);
      if (!exists) {
        await pool.query(column.sql);
      }
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
