import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ConsentPage from './pages/ConsentPage';
import Dass21Page from './pages/Dass21Page';
import CssrsPage from './pages/CssrsPage';
import EsmCheckinPage from './pages/EsmCheckinPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';

function Shell({ children }) {
  const location = useLocation();
  const hideNav = ['/login', '/signup'].includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8' }}>
      {!hideNav && <Navbar />}
      {children}
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/consent"
          element={
            <ProtectedRoute>
              <ConsentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dass21"
          element={
            <ProtectedRoute>
              <Dass21Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cssrs"
          element={
            <ProtectedRoute>
              <CssrsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/esm"
          element={
            <ProtectedRoute>
              <EsmCheckinPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
