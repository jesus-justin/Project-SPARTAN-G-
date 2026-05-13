import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { moduleOrder, studentModules, getPrimaryPageForModule } from '../config/portalModules';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.first_name || user?.firstName || user?.name || 'Student';

  return (
    <header className="brand-header">
      <div className="brand-block">
        <div className="brand-mark">
          <img src="/src/assets/hero.png" alt="SPARTAN-G" />
        </div>
        <div className="brand-text">
          <strong>SPARTAN-G Student Portal</strong>
          <span>BatStateU-TNEU Lipa Campus mental health support system</span>
        </div>
      </div>

      <nav className="module-nav" aria-label="Primary navigation">
        {moduleOrder.map((moduleKey) => (
          <Link key={moduleKey} to={getPrimaryPageForModule(moduleKey)} className="nav-pill">
            {studentModules[moduleKey].label}
          </Link>
        ))}
        <Link to="/dashboard" className="nav-pill">
          Dashboard
        </Link>
        <span className="user-chip">
          {displayName}
          {user?.studentId || user?.student_id ? ` • ${user.studentId || user.student_id}` : ''}
        </span>
        <button onClick={handleLogout} className="secondary-pill" type="button">
          Logout
        </button>
      </nav>
    </header>
  );
}
