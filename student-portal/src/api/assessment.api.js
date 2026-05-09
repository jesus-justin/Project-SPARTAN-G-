import client from './client';

export async function submitDass21(answers) {
  const { data } = await client.post('/assessments/dass21', { answers });
  return data;
}

export async function getPhq9Questions() {
  const { data } = await client.get('/assessments/phq9/questions');
  return data;
}

export async function submitPhq9(answers) {
  const { data } = await client.post('/assessments/phq9/submit', { answers });
  return data;
}

export async function getGad7Questions() {
  const { data } = await client.get('/assessments/gad7/questions');
  return data;
}

export async function submitGad7(answers) {
  const { data } = await client.post('/assessments/gad7/submit', { answers });
  return data;
}

export async function submitEsm(payload) {
  const { data } = await client.post('/assessments/esm', payload);
  return data;
}

export async function getRecentEsm(limit = 7) {
  const { data } = await client.get(`/assessments/esm/recent?limit=${limit}`);
  return data;
}

export async function getLatestDass21() {
  const { data } = await client.get('/assessments/dass21/latest');
  return data;
}
