import { useEffect, useState } from 'react';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../api/ogc.api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    scheduledAt: '',
    notes: '',
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await getAppointments();
      if (res?.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!formData.studentId || !formData.scheduledAt) {
      setError('Student ID and date/time are required');
      return;
    }

    try {
      await createAppointment(formData.studentId, formData.scheduledAt, formData.notes);
      setFormData({ studentId: '', scheduledAt: '', notes: '' });
      setShowForm(false);
      setSuccessMsg('Appointment created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to create appointment');
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setSuccessMsg('Status updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'confirmed':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Appointments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showForm ? 'Cancel' : '+ New Appointment'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 12, background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Create New Appointment</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="Student ID"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 80 }}
                placeholder="Appointment notes"
              />
            </div>
            <button
              onClick={handleCreateAppointment}
              style={{
                padding: '12px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Create Appointment
            </button>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      {appointments.length === 0 ? (
        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>
          No appointments yet
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Student ID</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Notes</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.appointmentId} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: 12, color: '#333', fontWeight: 600 }}>{appointment.studentId}</td>
                  <td style={{ padding: 12, color: '#666' }}>
                    {new Date(appointment.scheduledAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        background: getStatusColor(appointment.status),
                        color: '#fff',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: '#666', fontSize: 12 }}>{appointment.notes}</td>
                  <td style={{ padding: 12 }}>
                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <select
                        value={appointment.status}
                        onChange={(e) => handleUpdateStatus(appointment.appointmentId, e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {statusOptions
                          .filter((s) => s !== appointment.status)
                          .map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
