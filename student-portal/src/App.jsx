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
import Phq9Page from './pages/Phq9Page';
import Gad7Page from './pages/Gad7Page';
import GinhawaPage from './pages/GinhawaPage';
import SafetyPlanPage from './pages/SafetyPlanPage';
import ContentDetailPage from './pages/ContentDetailPage';
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
          path="/phq9"
          element={
            <ProtectedRoute>
              <Phq9Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gad7"
          element={
            <ProtectedRoute>
              <Gad7Page />
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
        <Route
          path="/ginhawa"
          element={
            <ProtectedRoute>
              <GinhawaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/safety-plan"
          element={
            <ProtectedRoute>
              <SafetyPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/:id"
          element={
            <ProtectedRoute>
              <ContentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
