import http from 'http';

const BASE_URL = 'http://localhost:3001';
const results = [];

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function test(name, fn) {
  try {
    const result = await fn();
    results.push({ test: name, status: 'PASS', details: result });
    console.log(`✅ ${name}: PASS`);
  } catch (error) {
    results.push({ test: name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}: FAIL - ${error.message}`);
  }
}

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 8 VERIFICATION TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let studentJwt = null;
  let facilitatorJwt = null;
  let appointmentId = null;
  let contentId = null;

  // TEST 1: Health check
  await test('TEST 1.1 - Health check', async () => {
    const res = await makeRequest('GET', '/api/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.success || res.body.status !== 'ok') throw new Error('Invalid response');
    return 'Health check passed';
  });

  // TEST 2: PHQ-9 questions
  await test('TEST 2.1 - PHQ-9 questions endpoint', async () => {
    const res = await makeRequest('GET', '/api/assessments/phq9/questions');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body.data) || res.body.data.length !== 9) {
      throw new Error(`Expected 9 questions, got ${res.body.data?.length || 0}`);
    }
    return `Got ${res.body.data.length} PHQ-9 questions`;
  });

  // TEST 3: GAD-7 questions
  await test('TEST 3.1 - GAD-7 questions endpoint', async () => {
    const res = await makeRequest('GET', '/api/assessments/gad7/questions');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body.data) || res.body.data.length !== 7) {
      throw new Error(`Expected 7 questions, got ${res.body.data?.length || 0}`);
    }
    return `Got ${res.body.data.length} GAD-7 questions`;
  });

  // TEST 4: Full assessment flow
  console.log('\n--- TEST 4: Full Assessment Flow ---');

  await test('TEST 4.1 - Student registration', async () => {
    const res = await makeRequest('POST', '/api/auth/signup', {
      studentId: '2025-PHASE8',
      firstName: 'Phase',
      lastName: 'Eight Test',
      password: 'Test@2025',
      yearLevel: 2,
    });
    if (res.status !== 201 && res.status !== 200) throw new Error(`Status ${res.status}`);
    return 'Student registered';
  });

  await test('TEST 4.2 - Student login', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      studentId: '2025-PHASE8',
      password: 'Test@2025',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.data?.token) throw new Error('No token in response');
    studentJwt = res.body.data.token;
    return `Login successful, token length: ${studentJwt.length}`;
  });

  await test('TEST 4.3 - Student consent', async () => {
    const res = await makeRequest('POST', '/api/student/consent', { accepted: true }, studentJwt);
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    return 'Consent given';
  });

  await test('TEST 4.4 - Submit DASS-21', async () => {
    const res = await makeRequest(
      'POST',
      '/api/assessments/dass21/submit',
      { answers: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
      studentJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.data?.riskLevel) throw new Error('No risk level in response');
    return `DASS-21 submitted, risk: ${res.body.data.riskLevel}`;
  });

  await test('TEST 4.5 - Submit PHQ-9', async () => {
    const res = await makeRequest(
      'POST',
      '/api/assessments/phq9/submit',
      { answers: [2, 2, 2, 2, 2, 2, 2, 2, 2] },
      studentJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.data?.scoring?.severity) throw new Error('No severity in response');
    return `PHQ-9 submitted, severity: ${res.body.data.scoring.severity}, score: ${res.body.data.scoring.totalScore}`;
  });

  await test('TEST 4.6 - Submit GAD-7', async () => {
    const res = await makeRequest(
      'POST',
      '/api/assessments/gad7/submit',
      { answers: [2, 2, 2, 2, 2, 2, 2] },
      studentJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.data?.scoring?.severity) throw new Error('No severity in response');
    return `GAD-7 submitted, severity: ${res.body.data.scoring.severity}, score: ${res.body.data.scoring.totalScore}`;
  });

  await test('TEST 4.7 - Get trajectory', async () => {
    const res = await makeRequest('GET', '/api/student/trajectory', null, studentJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    if (!data.trajectory) throw new Error('No trajectory in response');
    return `Trajectory: ${data.trajectory}, mood slope: ${data.moodSlope}, energy slope: ${data.energySlope}`;
  });

  // TEST 5: GINHAWA student endpoints
  console.log('\n--- TEST 5: GINHAWA Student Endpoints ---');

  await test('TEST 5.1 - Get content library', async () => {
    const res = await makeRequest('GET', '/api/ginhawa/content', null, studentJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    const content = Array.isArray(data) ? data : data.grouped ? Object.values(data.grouped).flat() : [];
    if (content.length < 1) throw new Error('No content returned');
    return `Got ${content.length} content items`;
  });

  await test('TEST 5.2 - Save safety plan', async () => {
    const res = await makeRequest(
      'POST',
      '/api/ginhawa/safety-plan',
      {
        warningSigns: 'Feeling hopeless',
        copingStrategies: 'Deep breathing',
        socialSupports: 'Friends and family',
        professionalContacts: 'OGC: 043-980-0385',
        safeEnvironment: 'My room',
        reasonsToLive: 'Family and goals',
        emergencyContacts: 'NCMH: 1553',
      },
      studentJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    return 'Safety plan saved';
  });

  await test('TEST 5.3 - Retrieve safety plan', async () => {
    const res = await makeRequest('GET', '/api/ginhawa/safety-plan', null, studentJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    if (!data.warningSigns) throw new Error('Safety plan not found');
    return `Safety plan retrieved, warning signs: "${data.warningSigns}"`;
  });

  // TEST 6: GABAY facilitator endpoints
  console.log('\n--- TEST 6: GABAY Facilitator Endpoints ---');

  await test('TEST 6.1 - Facilitator login', async () => {
    const res = await makeRequest('POST', '/api/auth/facilitator/login', {
      email: 'ogc@batstateu.edu.ph',
      password: 'OGC@2025',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.data?.token) throw new Error('No token in response');
    facilitatorJwt = res.body.data.token;
    return `Facilitator login successful, token length: ${facilitatorJwt.length}`;
  });

  await test('TEST 6.2 - Get notifications', async () => {
    const res = await makeRequest('GET', '/api/gabay/notifications', null, facilitatorJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    const notifArray = Array.isArray(data) ? data : [];
    return `Got ${notifArray.length} notifications`;
  });

  await test('TEST 6.3 - Get population dashboard', async () => {
    const res = await makeRequest('GET', '/api/gabay/population-dashboard', null, facilitatorJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    if (!data.summary_7d) throw new Error('No summary_7d in response');
    return `Population dashboard retrieved with 7d, 14d, 30d summaries`;
  });

  await test('TEST 6.4 - Create appointment', async () => {
    const res = await makeRequest(
      'POST',
      '/api/gabay/appointments',
      {
        studentId: '2025-PHASE8',
        scheduledAt: '2026-06-01T10:00:00',
        notes: 'Follow-up for moderate risk assessment',
      },
      facilitatorJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    appointmentId = res.body.data?.appointmentId || res.body.data?.id;
    return `Appointment created, ID: ${appointmentId}`;
  });

  await test('TEST 6.5 - Get appointments list', async () => {
    const res = await makeRequest('GET', '/api/gabay/appointments', null, facilitatorJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    const apptArray = Array.isArray(data) ? data : [];
    if (apptArray.length < 1) throw new Error('No appointments found');
    return `Got ${apptArray.length} appointments`;
  });

  await test('TEST 6.6 - Update appointment status', async () => {
    if (!appointmentId) throw new Error('No appointment ID available');
    const res = await makeRequest(
      'PATCH',
      `/api/gabay/appointments/${appointmentId}/status`,
      { status: 'confirmed' },
      facilitatorJwt
    );
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return 'Appointment status updated to confirmed';
  });

  // TEST 7: GINHAWA content management
  console.log('\n--- TEST 7: GINHAWA Content Management ---');

  await test('TEST 7.1 - Create new content', async () => {
    const res = await makeRequest(
      'POST',
      '/api/ginhawa/content',
      {
        title: 'Phase 8 Test Article',
        description: 'Test wellness article for verification',
        contentType: 'article',
        contentUrl: 'https://example.com/wellness',
        riskLevels: ['Low', 'Moderate'],
        category: 'Mental Health',
      },
      facilitatorJwt
    );
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    contentId = res.body.data?.contentId || res.body.data?.id;
    return `Content created, ID: ${contentId}`;
  });

  await test('TEST 7.2 - Publish content', async () => {
    if (!contentId) throw new Error('No content ID available');
    const res = await makeRequest('PATCH', `/api/ginhawa/content/${contentId}/publish`, {}, facilitatorJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return 'Content published';
  });

  await test('TEST 7.3 - Verify published content visible to student', async () => {
    const res = await makeRequest('GET', '/api/ginhawa/content', null, studentJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = res.body.data || res.body;
    const content = Array.isArray(data) ? data : data.grouped ? Object.values(data.grouped).flat() : [];
    const found = content.some((c) => c.contentId === contentId || c.id === contentId);
    if (!found) throw new Error('Published content not visible to student');
    return 'Published content visible to student';
  });

  await test('TEST 7.4 - Archive content', async () => {
    if (!contentId) throw new Error('No content ID available');
    const res = await makeRequest('DELETE', `/api/ginhawa/content/${contentId}`, null, facilitatorJwt);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return 'Content archived';
  });

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('VERIFICATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testGroups = {
    'TEST 1 - Health Check': results.filter((r) => r.test.startsWith('TEST 1')),
    'TEST 2 - PHQ-9 Questions': results.filter((r) => r.test.startsWith('TEST 2')),
    'TEST 3 - GAD-7 Questions': results.filter((r) => r.test.startsWith('TEST 3')),
    'TEST 4 - Full Assessment Flow': results.filter((r) => r.test.startsWith('TEST 4')),
    'TEST 5 - GINHAWA Student': results.filter((r) => r.test.startsWith('TEST 5')),
    'TEST 6 - GABAY Facilitator': results.filter((r) => r.test.startsWith('TEST 6')),
    'TEST 7 - GINHAWA Management': results.filter((r) => r.test.startsWith('TEST 7')),
  };

  const summary = [];
  for (const [group, tests] of Object.entries(testGroups)) {
    const passed = tests.filter((t) => t.status === 'PASS').length;
    const total = tests.length;
    const status = passed === total ? '✅ PASS' : '❌ FAIL';
    summary.push({ group, passed, total, status });
    console.log(`${status} | ${group}: ${passed}/${total}`);
  }

  const totalTests = results.length;
  const totalPassed = results.filter((r) => r.status === 'PASS').length;
  const totalFailed = totalTests - totalPassed;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`);
  if (totalFailed > 0) {
    console.log(`⚠️  ${totalFailed} test(s) FAILED`);
  } else {
    console.log('✅ ALL TESTS PASSED');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
