import { useEffect, useState } from 'react';
import { getAppointments, approveAppointment, rejectAppointment, completeAppointment } from '../api/ogc.api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleApprove = async (appointmentId) => {
    if (!window.confirm('Approve this appointment?')) {
      return;
    }

    try {
      await approveAppointment(appointmentId);
      setSuccessMsg('Appointment approved!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to approve appointment');
    }
  };

  const handleReject = async (appointmentId) => {
    if (!window.confirm('Reject this appointment?')) {
      return;
    }

    try {
      await rejectAppointment(appointmentId);
      setSuccessMsg('Appointment rejected!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to reject appointment');
    }
  };

  const handleComplete = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as complete?')) {
      return;
    }

    try {
      await completeAppointment(appointmentId);
      setSuccessMsg('Appointment marked as complete!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to complete appointment');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': '#ff9800',
      'requested': '#ff9800',
      'approved': '#2196f3',
      'approved': '#2196f3',
      'rejected': '#d32f2f',
      'completed': '#4caf50',
      'cancelled': '#9e9e9e',
    };
    return statusMap[status?.toLowerCase()] || '#757575';
  };

  if (loading) {
    return <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <h2 style={{ margin: 0, marginBottom: 24 }}>Appointment Requests</h2>

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

      {appointments.length === 0 ? (
        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>
          No appointment requests
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Student ID</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Time</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Requested</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => {
                const status = (appointment.status || 'pending').toLowerCase();
                return (
                  <tr key={appointment.appointmentId || appointment.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: 12, color: '#333', fontWeight: 600 }}>
                      {appointment.pseudoId || appointment.studentId}
                    </td>
                    <td style={{ padding: 12, color: '#666' }}>{appointment.slotDate || appointment.date || '-'}</td>
                    <td style={{ padding: 12, color: '#666' }}>
                      {appointment.startTime || appointment.time || '-'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: getStatusColor(status),
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: '#666', fontSize: 12 }}>
                      {new Date(appointment.requestedAt || appointment.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: 12 }}>
                      {status === 'pending' || status === 'requested' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleApprove(appointment.appointmentId || appointment.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(appointment.appointmentId || appointment.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#d32f2f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : status === 'approved' ? (
                        <button
                          onClick={() => handleComplete(appointment.appointmentId || appointment.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#2196f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: 12 }}>No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
