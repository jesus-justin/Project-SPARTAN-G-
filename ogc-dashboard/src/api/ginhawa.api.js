import client from './client';

export async function getGinhawaContent() {
  const { data } = await client.get('/ginhawa/content');
  return data;
}

export async function getGinhawaContentDetail(id) {
  const { data } = await client.get(`/ginhawa/content/${id}`);
  return data;
}

export async function createGinhawaContent(contentData) {
  const { data } = await client.post('/ginhawa/content', contentData);
  return data;
}

export async function updateGinhawaContent(id, contentData) {
  const { data } = await client.patch(`/ginhawa/content/${id}`, contentData);
  return data;
}

export async function publishGinhawaContent(id) {
  const { data } = await client.patch(`/ginhawa/content/${id}/publish`);
  return data;
}

export async function archiveGinhawaContent(id) {
  const { data } = await client.delete(`/ginhawa/content/${id}`);
  return data;
}
