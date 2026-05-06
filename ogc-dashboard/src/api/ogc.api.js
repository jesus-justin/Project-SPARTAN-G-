import client from './client';

export async function facilitatorLogin(payload) {
  const { data } = await client.post('/auth/login', payload);
  return data;
}

export async function getNotifications() {
  const { data } = await client.get('/ogc/notifications');
  return data;
}

export async function acknowledgeNotification(notificationId) {
  const { data } = await client.post(`/ogc/notifications/${notificationId}/acknowledge`);
  return data;
}
