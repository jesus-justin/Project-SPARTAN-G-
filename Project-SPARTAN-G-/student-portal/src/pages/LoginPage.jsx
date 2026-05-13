import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth.api';

const ogcAppUrl = import.meta.env.VITE_OGC_APP_URL || 'http://localhost:5174/';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ role: 'student', studentId: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (form.role === 'student') {
        await login({ role: 'student', studentId: form.studentId, password: form.password });
        navigate(from, { replace: true });
        return;
      }

      const response = await loginApi({ role: 'ogc', email: form.email, password: form.password });
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('ogc_token', token);
      }
      window.location.href = ogcAppUrl;
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-banner">
          <div className="brand-mark">
            <img src="/src/assets/hero.png" alt="SPARTAN-G" />
          </div>
          <h1 style={{ margin: '0 0 6px 0', color: '#fff' }}>SPARTAN-G Portal</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>Student assessment and wellness access</p>
        </div>

        <div className="form-body">
          <form onSubmit={onSubmit} className="form-grid">
            <label>
              Login as
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                    studentId: e.target.value === 'student' ? prev.studentId : '',
                    email: e.target.value === 'facilitator' ? prev.email : '',
                  }))
                }
              >
                <option value="student">Student</option>
                <option value="facilitator">Facilitator</option>
              </select>
            </label>
            {form.role === 'student' ? (
              <label>
                Student ID
                <input
                  required
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  placeholder="Enter your student ID"
                />
              </label>
            ) : (
              <label>
                Facilitator Email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter your facilitator email"
                />
              </label>
            )}
            <label>
              Password
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter your password"
              />
            </label>
            {error && <div className="status-badge crisis">{error}</div>}
            <button type="submit" disabled={loading} className="form-button">
              {loading ? 'Signing in...' : form.role === 'student' ? 'Login as Student' : 'Login as Facilitator'}
            </button>
          </form>
          <p style={{ marginTop: 14, textAlign: 'center' }}>
            New user? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
