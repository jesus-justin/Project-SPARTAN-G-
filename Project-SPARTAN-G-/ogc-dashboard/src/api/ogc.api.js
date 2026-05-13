import client from './client';

export async function facilitatorLogin(payload) {
  const { data } = await client.post('/auth/login', {
    role: 'ogc',
    ...payload,
  });
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

export async function getAvailabilitySlots() {
  const { data } = await client.get('/ogc/availability/slots');
  return data;
}

export async function createAvailabilitySlot(payload) {
  const { data } = await client.post('/ogc/availability/slots', payload);
  return data;
}

export async function deleteAvailabilitySlot(slotId) {
  const { data } = await client.delete(`/ogc/availability/slots/${slotId}`);
  return data;
}

export async function getEmergencyContacts() {
  const { data } = await client.get('/ogc/emergency-contacts');
  return data;
}

export async function createEmergencyContact(payload) {
  const { data } = await client.post('/ogc/emergency-contacts', payload);
  return data;
}

export async function deleteEmergencyContact(contactId) {
  const { data } = await client.delete(`/ogc/emergency-contacts/${contactId}`);
  return data;
}

export async function approveAppointment(appointmentId) {
  const { data } = await client.patch(`/gabay/appointments/${appointmentId}/approve`);
  return data;
}

export async function rejectAppointment(appointmentId) {
  const { data } = await client.patch(`/gabay/appointments/${appointmentId}/reject`);
  return data;
}

export async function completeAppointment(appointmentId) {
  const { data } = await client.patch(`/gabay/appointments/${appointmentId}/complete`);
  return data;
}

