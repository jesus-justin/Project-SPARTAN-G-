import { useEffect, useState } from 'react';
import { createAvailabilitySlot, getAvailabilitySlots, deleteAvailabilitySlot } from '../api/ogc.api';

export default function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '',
    endTime: '',
    maxSlots: 5,
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const res = await getAvailabilitySlots();
      if (res?.data) {
        setSlots(res.data);
      }
    } catch (err) {
      setError('Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!formData.slotDate || !formData.startTime || !formData.endTime) {
      setError('Date, start time, and end time are required');
      return;
    }

    try {
      await createAvailabilitySlot({
        slotDate: formData.slotDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxSlots: formData.maxSlots,
      });
      setFormData({ slotDate: '', startTime: '', endTime: '', maxSlots: 5 });
      setShowForm(false);
      setSuccessMsg('Slot created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadSlots();
    } catch (err) {
      setError('Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      await deleteAvailabilitySlot(slotId);
      setSuccessMsg('Slot deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadSlots();
    } catch (err) {
      setError('Failed to delete slot');
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Manage Availability Slots</h2>
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
          {showForm ? 'Cancel' : '+ Create Slot'}
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

      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Create New Slot</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Date *</label>
              <input
                type="date"
                value={formData.slotDate}
                onChange={(e) => setFormData({ ...formData, slotDate: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Max Slots</label>
              <input
                type="number"
                min="1"
                value={formData.maxSlots}
                onChange={(e) => setFormData({ ...formData, maxSlots: Number(e.target.value) })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
          </div>
          <button
            onClick={handleCreateSlot}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Create Slot
          </button>
        </div>
      )}

      {slots.length === 0 ? (
        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>
          No availability slots created yet
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Start Time</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>End Time</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Max Slots</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.slotId || slot.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: 12, color: '#333' }}>{slot.slotDate || slot.date}</td>
                  <td style={{ padding: 12, color: '#666' }}>{slot.startTime || slot.start_time}</td>
                  <td style={{ padding: 12, color: '#666' }}>{slot.endTime || slot.end_time}</td>
                  <td style={{ padding: 12, color: '#666' }}>{slot.maxSlots || slot.max_slots || 5}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        background: slot.status === 'Available' ? '#4caf50' : '#ff9800',
                        color: '#fff',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {slot.status || 'Available'}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleDeleteSlot(slot.slotId || slot.id)}
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
                      Delete
                    </button>
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
