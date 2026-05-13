import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        background: '#CC0000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
      }}
    >
      <strong>SPARTAN-G Student Portal</strong>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>
        <Link to="/dass21" style={{ color: '#fff' }}>DASS-21</Link>
        <Link to="/esm" style={{ color: '#fff' }}>ESM</Link>
        <span style={{ opacity: 0.9 }}>
          {user?.first_name || user?.firstName || 'Student'}
          {user?.studentId || user?.student_id ? (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.85 }}>({user?.studentId || user?.student_id})</span>
          ) : null}
        </span>
        <button onClick={handleLogout} style={{ border: 0, borderRadius: 8, padding: '6px 10px' }}>
          Logout
        </button>
      </nav>
    </header>
  );
}
