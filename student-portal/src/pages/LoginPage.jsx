import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
      <h1 style={{ color: '#CC0000', marginTop: 0 }}>SPARTAN-G Student Portal</h1>
      <form onSubmit={onSubmit}>
        <label>Student ID</label>
        <input
          required
          value={form.studentId}
          onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
          style={{ width: '100%', marginTop: 6, marginBottom: 12, padding: 10 }}
        />
        <label>Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          style={{ width: '100%', marginTop: 6, marginBottom: 12, padding: 10 }}
        />
        {error && <p style={{ color: '#D32F2F' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: 10 }}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        New student? <Link to="/signup">Create account</Link>
      </p>
    </div>
  );
}
