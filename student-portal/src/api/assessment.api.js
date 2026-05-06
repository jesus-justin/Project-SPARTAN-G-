import client from './client';

export async function submitDass21(answers) {
  const { data } = await client.post('/assessments/dass21', { answers });
  return data;
}

export async function submitCssrs(payload) {
  const { data } = await client.post('/assessments/cssrs', payload);
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

export async function getLatestCssrs() {
  const { data } = await client.get('/assessments/cssrs/latest');
  return data;
}
