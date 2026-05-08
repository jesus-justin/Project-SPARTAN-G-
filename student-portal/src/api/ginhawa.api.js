import client from './client';

export async function getGinhawaContent() {
  const { data } = await client.get('/ginhawa/content');
  return data;
}

export async function getGinhawaContentDetail(id) {
  const { data } = await client.get(`/ginhawa/content/${id}`);
  return data;
}

export async function getSafetyPlan() {
  const { data } = await client.get('/ginhawa/safety-plan');
  return data;
}

export async function saveSafetyPlan(planData) {
  const { data } = await client.post('/ginhawa/safety-plan', planData);
  return data;
}
