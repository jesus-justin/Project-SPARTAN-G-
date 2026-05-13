import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

export default function OgcLoginPage() {
  const { login } = useFacilitatorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0, color: '#CC0000' }}>SPARTAN-G OGC Dashboard</h2>
      <p>Use facilitator credentials</p>
      <form onSubmit={submit}>
        <input
          placeholder="Facilitator Email"
          required
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        {error && <p style={{ color: '#D32F2F' }}>{error}</p>}
        <button style={{ width: '100%', background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: 10 }}>
          Login
        </button>
      </form>
    </div>
  );
}
