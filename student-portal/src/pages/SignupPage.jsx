import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    yearLevel: '',
    password: '',
  });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(form);
      navigate('/consent');
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '36px auto', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Create Student Account</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Student ID" required value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <input placeholder="First Name" required value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <input placeholder="Last Name" required value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <input placeholder="Year Level" value={form.yearLevel} onChange={(e) => setForm((p) => ({ ...p, yearLevel: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <input type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        {error && <p style={{ color: '#D32F2F' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: 10 }}>
          Sign Up
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
