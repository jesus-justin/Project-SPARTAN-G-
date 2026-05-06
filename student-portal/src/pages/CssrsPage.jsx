import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCssrs } from '../api/assessment.api';

const ITEMS = [
  ['item1', 'Wish to be dead?'],
  ['item2', 'Non-specific active suicidal thoughts?'],
  ['item3', 'Active suicidal ideation with method, intent, or plan?'],
  ['item4', 'Any suicidal behavior in recent period?'],
  ['item5', 'Any lifetime suicidal behavior?'],
];

export default function CssrsPage() {
  const [form, setForm] = useState({ item1: false, item2: false, item3: false, item4: false, item5: false });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await submitCssrs(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit C-SSRS');
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '30px auto', padding: 18 }}>
      <h2>C-SSRS Light</h2>
      <form onSubmit={handleSubmit}>
        {ITEMS.map(([key, label]) => (
          <label key={key} style={{ display: 'block', border: '1px solid #eee', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
            />{' '}
            {label}
          </label>
        ))}
        {error && <p style={{ color: '#D32F2F' }}>{error}</p>}
        <button type="submit" style={{ background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: '10px 14px' }}>
          Submit C-SSRS
        </button>
      </form>
    </div>
  );
}
