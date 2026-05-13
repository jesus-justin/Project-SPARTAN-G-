import { pool } from '../config/db.js';

const testStudentIds = [
  '2025-TEST-01',
  '2025-VERIFY-01',
  '2025-VERIFY-02',
  '2025-PHASE8',
];

const protectedStudentIds = [
  'ogc@batstateu.edu.ph',
  '23-37187',
  '23-39897',
];

async function main() {
  try {
    const placeholdersDelete = testStudentIds.map(() => '?').join(', ');
    const placeholdersKeep = protectedStudentIds.map(() => '?').join(', ');

    const [result] = await pool.query(
      `DELETE FROM users
       WHERE student_id IN (${placeholdersDelete})
         AND student_id NOT IN (${placeholdersKeep})`,
      [...testStudentIds, ...protectedStudentIds]
    );

    console.log(`Cleanup complete: deleted ${result.affectedRows || 0} test user(s)`);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
