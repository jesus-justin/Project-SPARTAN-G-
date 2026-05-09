import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const collegeOptions = ['CICS', 'COE', 'CIT', 'CAS', 'COED', 'CBA', 'CAFA', 'CTHM'];
  const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  const sexOptions = ['Male', 'Female', 'Prefer not to say'];

  const [form, setForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    college: collegeOptions[0],
    yearLevel: yearLevelOptions[0],
    program: '',
    sex: '',
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
        <select value={form.college} onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
          {collegeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={form.yearLevel} onChange={(e) => setForm((p) => ({ ...p, yearLevel: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
          {yearLevelOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input placeholder="Program (optional)" value={form.program} onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <select value={form.sex} onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
          <option value="">Sex (optional)</option>
          {sexOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
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
