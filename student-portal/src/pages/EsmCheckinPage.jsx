import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitEsm } from '../api/assessment.api';

export default function EsmCheckinPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mood: 3, energy: 3, stress: 3, note: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await submitEsm({
        mood: Number(form.mood),
        energy: Number(form.energy),
        stress: Number(form.stress),
        note: form.note,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit ESM check-in');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '28px auto', padding: 16 }}>
      <h2>ESM Daily Check-In</h2>
      <form onSubmit={submit}>
        <label>Mood (1-5)</label>
        <input type="number" min="1" max="5" value={form.mood} onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <label>Energy (1-5)</label>
        <input type="number" min="1" max="5" value={form.energy} onChange={(e) => setForm((p) => ({ ...p, energy: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <label>Stress (1-5)</label>
        <input type="number" min="1" max="5" value={form.stress} onChange={(e) => setForm((p) => ({ ...p, stress: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <label>Note</label>
        <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} rows={4} />
        {error && <p style={{ color: '#D32F2F' }}>{error}</p>}
        <button type="submit" style={{ background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: '10px 14px' }}>
          Submit Check-In
        </button>
      </form>
    </div>
  );
}
