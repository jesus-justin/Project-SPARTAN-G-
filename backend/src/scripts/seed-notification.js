import path from 'node:path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_NAME) {
  throw new Error('Missing required DB environment variables');
}

async function main() {
  const pool = await mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD || undefined,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ogc_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        facilitator_user_id INT NULL,
        risk_level VARCHAR(32) NULL,
        title VARCHAR(255),
        body TEXT,
        seen TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    const studentId = '2025-TEST-01';
    const studentPassword = 'Test@2025';
    const facilitatorEmail = 'ogc@batstateu.edu.ph';

    const studentPasswordHash = await bcrypt.hash(studentPassword, 12);

    await pool.query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, year_level, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         year_level = VALUES(year_level),
         role = VALUES(role)`,
      [studentId, studentPasswordHash, 'Test', 'Student', '1', 'student']
    );

    const [studentRows] = await pool.query('SELECT id FROM users WHERE student_id = ?', [studentId]);
    const [facRows] = await pool.query('SELECT id FROM users WHERE student_id = ? AND role = ?', [facilitatorEmail, 'facilitator']);

    if (!Array.isArray(studentRows) || studentRows.length === 0) {
      throw new Error('Unable to seed test student');
    }
    if (!Array.isArray(facRows) || facRows.length === 0) {
      throw new Error('Unable to locate facilitator account');
    }

    const studentRow = studentRows[0];
    const facilitatorRow = facRows[0];

    await pool.query(
      `INSERT INTO ogc_notifications (student_id, facilitator_user_id, risk_level, title, body, seen)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [studentRow.id, facilitatorRow.id, 'High', 'High Risk Alert', 'Student 2025-TEST-01 was classified as High risk.',]
    );

    console.log('Notification seeded successfully');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
