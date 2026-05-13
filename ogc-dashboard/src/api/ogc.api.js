import client from './client';

export async function facilitatorLogin(payload) {
  const { data } = await client.post('/auth/facilitator/login', payload);
  return data;
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function getNotifications() {
  const { data } = await client.get('/gabay/notifications');
  return data;
}

export async function getNotificationHistory() {
  const { data } = await client.get('/gabay/notifications/history');
  return data;
}

export async function acknowledgeNotification(notificationId) {
  const { data } = await client.patch(`/gabay/notifications/${notificationId}/acknowledge`);
  return data;
}

export async function deleteNotification(notificationId) {
  const { data } = await client.delete(`/gabay/notifications/${notificationId}`);
  return data;
}

export async function getPopulationDashboard() {
  const { data } = await client.get('/gabay/population-dashboard');
  return data;
}

export async function getAppointments() {
  const { data } = await client.get('/gabay/appointments');
  return data;
}

export async function createAppointment(studentId, scheduledAt, notes) {
  const { data } = await client.post('/gabay/appointments', {
    studentId,
    scheduledAt,
    notes,
  });
  return data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data } = await client.patch(`/gabay/appointments/${appointmentId}/status`, { status });
  return data;
}

export async function getStudentDetail(studentId) {
  const { data } = await client.get(`/gabay/students/${studentId}`);
  return data;
}

