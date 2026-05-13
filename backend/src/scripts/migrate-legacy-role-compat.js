import { pool } from '../config/db.js';

function splitName(fullName) {
  const text = String(fullName || '').trim();
  if (!text) {
    return { firstName: 'OGC', lastName: 'Facilitator' };
  }

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  const firstName = parts.shift();
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(rows?.[0]?.count || 0) > 0;
}

async function getObjectType(name) {
  const [rows] = await pool.query(
    `SELECT TABLE_TYPE
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [name]
  );

  return rows?.[0]?.TABLE_TYPE || null;
}

async function ensureRoleColumn() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student'`);
  await pool.query(`UPDATE users SET role = 'student' WHERE role IS NULL OR TRIM(role) = ''`);
}

async function syncLegacyFacilitators() {
  const hasLegacyFacilitators = await tableExists('facilitators');
  if (!hasLegacyFacilitators) {
    console.log('No legacy facilitators table detected. Skipping facilitator sync.');
    return;
  }

  const [rows] = await pool.query(
    `SELECT facilitator_id, name, assigned_college, email, password_hash
     FROM facilitators`
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('Legacy facilitators table is empty.');
    return;
  }

  for (const row of rows) {
    const email = String(row.email || '').trim();
    if (!email) {
      continue;
    }

    const { firstName, lastName } = splitName(row.name);

    await pool.query(
      `INSERT INTO users (student_id, password_hash, first_name, last_name, college, year_level, role)
       VALUES (?, ?, ?, ?, ?, NULL, 'facilitator')
       ON DUPLICATE KEY UPDATE
         password_hash = COALESCE(VALUES(password_hash), users.password_hash),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         college = VALUES(college),
         role = 'facilitator'`,
      [
        email,
        row.password_hash || null,
        firstName,
        lastName,
        row.assigned_college || null,
      ]
    );
  }

  console.log(`Synced ${rows.length} facilitator account(s) from legacy facilitators table.`);
}

async function createCompatibilityViews() {
  const studentsType = await getObjectType('students');
  if (!studentsType || studentsType === 'VIEW') {
    await pool.query('DROP VIEW IF EXISTS students');
    await pool.query(
      `CREATE VIEW students AS
       SELECT
         u.student_id AS student_id,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS name,
         CASE WHEN u.student_id LIKE '%@%' THEN u.student_id ELSE NULL END AS email,
         u.password_hash AS password_hash,
         COALESCE(u.college, '') AS college,
         COALESCE(u.year_level, 1) AS year_level,
         CASE
           WHEN UPPER(COALESCE(u.sex, '')) = 'F' THEN 'F'
           ELSE 'M'
         END AS sex,
         COALESCE(
           (
             SELECT sc.accepted
             FROM student_consents sc
             WHERE sc.user_id = u.id
             ORDER BY sc.created_at DESC, sc.id DESC
             LIMIT 1
           ),
           1
         ) AS consent_flag,
         DATE_FORMAT(u.created_at, '%Y-%m-%dT%H:%i:%sZ') AS registered_at
       FROM users u
       WHERE u.role = 'student'`
    );
    console.log('Created compatibility view: students');
  } else {
    console.log('Compatibility view not created: students is an existing base table.');
  }

  const facilitatorsType = await getObjectType('facilitators');
  if (!facilitatorsType || facilitatorsType === 'VIEW') {
    await pool.query('DROP VIEW IF EXISTS facilitators');
    await pool.query(
      `CREATE VIEW facilitators AS
       SELECT
         u.id AS facilitator_id,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS name,
         COALESCE(u.college, 'All') AS assigned_college,
         u.student_id AS email,
         u.password_hash AS password_hash
       FROM users u
       WHERE u.role = 'facilitator'`
    );
    console.log('Created compatibility view: facilitators');
  } else {
    console.log('Compatibility view not created: facilitators is an existing base table.');
  }
}

async function main() {
  try {
    await ensureRoleColumn();
    await syncLegacyFacilitators();
    await createCompatibilityViews();
    console.log('Legacy role compatibility migration complete.');
  } catch (error) {
    console.error('Legacy role compatibility migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
