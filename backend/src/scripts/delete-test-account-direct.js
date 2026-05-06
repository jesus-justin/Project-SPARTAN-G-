import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

async function run() {
  const conn = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword || undefined,
    database: env.dbName,
  });

  try {
    const [rows] = await conn.execute('SELECT id, student_id FROM users WHERE student_id = ?', ['test_student_001']);
    console.log('Found rows:', rows);

    const [res] = await conn.execute('DELETE FROM users WHERE student_id = ?', ['test_student_001']);
    console.log('Delete result:', res);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }

  console.log('Done');
  process.exit(0);
}

run();
