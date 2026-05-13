import { env } from '../config/env.js';

const BASE = process.env.BASE_URL || `http://localhost:${env.port}`;

async function doRequest(name, fn) {
  try {
    const res = await fn();
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    if (res.ok) {
      console.log(`${name}: PASS`);
      console.log(JSON.stringify(body, null, 2));
      return { ok: true, body };
    }
    console.log(`${name}: FAIL (status ${res.status})`);
    console.log(JSON.stringify(body, null, 2));
    return { ok: false, body };
  } catch (err) {
    console.log(`${name}: ERROR`);
    console.error(err);
    return { ok: false, body: null };
  }
}

async function run() {
  console.log('SMOKE TEST START', BASE);

  // 1. Register student
  const student = { studentId: 'test_student_001', password: 'Test@1234', firstName: 'Test', lastName: 'Student', yearLevel: '1' };
  const r1 = await doRequest('Student Register', () => fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(student) }));

  // 2. Student login
  const r2 = await doRequest('Student Login', () => fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: student.studentId, password: student.password }) }));
  const studentToken = r2.ok && r2.body && r2.body.data ? r2.body.data.token : null;

  // 3. Facilitator login
  const fac = { email: 'ogc@batstateu.edu.ph', password: 'OGC@2025' };
  const r3 = await doRequest('Facilitator Login', () => fetch(`${BASE}/api/auth/facilitator/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fac) }));

  // 4. GET DASS-21 questions
  const r4 = await doRequest('GET DASS21 Questions', () => fetch(`${BASE}/api/assessments/dass21/questions`, { method: 'GET', headers: { Authorization: studentToken ? `Bearer ${studentToken}` : '' } }));

  // 5. POST consent
  const r5 = await doRequest('POST Student Consent', () => fetch(`${BASE}/api/student/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: studentToken ? `Bearer ${studentToken}` : '' }, body: JSON.stringify({ accepted: true }) }));

  const allOk = [r1, r2, r3, r4, r5].every(r => r.ok);
  console.log('\nSMOKE TEST ' + (allOk ? 'ALL PASS' : 'SOME FAILURES'));
  process.exit(allOk ? 0 : 1);
}

run();
