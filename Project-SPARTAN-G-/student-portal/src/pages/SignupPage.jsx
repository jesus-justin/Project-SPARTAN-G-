import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupApi } from '../api/auth.api';

const ogcAppUrl = import.meta.env.VITE_OGC_APP_URL || 'http://localhost:5174/';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const collegeOptions = ['CICS', 'COE', 'CIT', 'CAS', 'COED', 'CBA', 'CAFA', 'CTHM'];
  const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  const sexOptions = ['Male', 'Female', 'Prefer not to say'];

  const [form, setForm] = useState({
    role: 'student',
    studentId: '',
    email: '',
    name: '',
    firstName: '',
    lastName: '',
    college: collegeOptions[0],
    assignedCollege: collegeOptions[0],
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
      if (form.role === 'student') {
        await signup({
          role: 'student',
          studentId: form.studentId,
          firstName: form.firstName,
          lastName: form.lastName,
          college: form.college,
          yearLevel: form.yearLevel,
          program: form.program,
          sex: form.sex,
          password: form.password,
        });
        navigate('/consent');
        return;
      }

      const response = await signupApi({
        role: 'ogc',
        name: form.name,
        email: form.email,
        assignedCollege: form.assignedCollege,
        password: form.password,
      });
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('ogc_token', token);
      }
      window.location.href = ogcAppUrl;
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <div className="auth-banner">
          <div className="brand-mark">
            <img src="/src/assets/hero.png" alt="SPARTAN-G" />
          </div>
          <h1 style={{ margin: '0 0 6px 0', color: '#fff' }}>Create Student Account</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>Join the SPARTAN-G student portal</p>
        </div>

        <div className="form-body">
          <form onSubmit={onSubmit} className="form-grid">
            <label>
              Register as
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                    studentId: e.target.value === 'student' ? prev.studentId : '',
                    email: e.target.value === 'facilitator' ? prev.email : '',
                    name: e.target.value === 'facilitator' ? prev.name : '',
                  }))
                }
              >
                <option value="student">Student</option>
                <option value="facilitator">Facilitator</option>
              </select>
            </label>
            {form.role === 'student' ? (
              <>
                <label>
                  Student ID
                  <input
                    placeholder="Student ID"
                    required
                    value={form.studentId}
                    onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  />
                </label>
                <div className="section-grid">
                  <label>
                    First Name
                    <input
                      placeholder="First Name"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </label>
                  <label>
                    Last Name
                    <input
                      placeholder="Last Name"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  College
                  <select value={form.college} onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}>
                    {collegeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Year Level
                  <select value={form.yearLevel} onChange={(e) => setForm((p) => ({ ...p, yearLevel: e.target.value }))}>
                    {yearLevelOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Program
                  <input
                    placeholder="Program (optional)"
                    value={form.program}
                    onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))}
                  />
                </label>
                <label>
                  Sex
                  <select value={form.sex} onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}>
                    <option value="">Sex (optional)</option>
                    {sexOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Facilitator Name
                  <input
                    placeholder="Full name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </label>
                <label>
                  Facilitator Email
                  <input
                    type="email"
                    placeholder="Facilitator email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </label>
                <label>
                  Assigned College
                  <select value={form.assignedCollege} onChange={(e) => setForm((p) => ({ ...p, assignedCollege: e.target.value }))}>
                    {collegeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              Password
              <input
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </label>
            {error && <div className="status-badge crisis">{error}</div>}
            <button type="submit" className="form-button">{form.role === 'student' ? 'Create Student Account' : 'Create Facilitator Account'}</button>
          </form>
          <p style={{ marginTop: 14, textAlign: 'center' }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
