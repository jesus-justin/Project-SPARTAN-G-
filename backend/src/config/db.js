import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

pool.on && pool.on('error', (err) => {
  console.error('Unexpected MySQL pool error:', err);
});

function convertDollarParams(sql) {
  // Replace $1, $2 ... with ?
  return sql.replace(/\$\d+/g, '?');
}

function parseInsertTable(sql) {
  const m = /INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?/i.exec(sql);
  return m ? m[1] : null;
}

export async function query(text, params = []) {
  const hasReturning = /RETURNING\s+/i.test(text);
  let sql = text;

  if (hasReturning) {
    // Remove RETURNING clause for MySQL; we'll emulate it.
    sql = text.replace(/RETURNING[\s\S]*$/i, '');
  }

  const converted = convertDollarParams(sql);
  const [rows, fields] = await pool.execute(converted, params);

  if (hasReturning) {
    // Try to return the inserted row by id
    const table = parseInsertTable(sql);
    if (table && rows && rows.insertId) {
      const [r] = await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [rows.insertId]);
      return { rows: r, rowCount: r.length, insertId: rows.insertId };
    }
  }

  // Normalize return to mimic pg.query
  if (Array.isArray(rows)) {
    return { rows, rowCount: rows.length };
  }

  return { rows: [], rowCount: 0 };
}

export async function healthcheckDb() {
  const [rows] = await pool.execute('SELECT NOW() as now');
  return rows[0];
}
