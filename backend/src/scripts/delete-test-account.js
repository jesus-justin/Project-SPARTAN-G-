import { query } from '../config/db.js';

async function run() {
  try {
    const studentId = 'test_student_001';
    const res = await query('DELETE FROM users WHERE student_id = $1', [studentId]);
    console.log('Delete result:', res);
  } catch (err) {
    console.error('Error deleting test account:', err);
    process.exit(1);
  }

  console.log('Done');
  process.exit(0);
}

run();
