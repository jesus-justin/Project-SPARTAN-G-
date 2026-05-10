import { Navigate, Route, Routes } from 'react-router-dom';
import FacilitatorProtectedRoute from './components/FacilitatorProtectedRoute';
import OgcLoginPage from './pages/OgcLoginPage';
import OgcDashboardPage from './pages/OgcDashboardPage';
import StudentDetailPage from './pages/StudentDetailPage';
import GinhawaManagePage from './pages/GinhawaManagePage';
import AppointmentsPage from './pages/AppointmentsPage';
import PredictiveAnalyticsPage from './pages/PredictiveAnalyticsPage';
import { useFacilitatorAuth } from './context/FacilitatorAuthContext';

export default function App() {
  const { isAuthenticated } = useFacilitatorAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6' }}>
      <Routes>
        <Route path="/login" element={<OgcLoginPage />} />
        <Route
          path="/dashboard"
          element={
            <FacilitatorProtectedRoute>
              <OgcDashboardPage />
            </FacilitatorProtectedRoute>
          }
        />
        <Route
          path="/students/:caseId"
          element={
            <FacilitatorProtectedRoute>
              <StudentDetailPage />
            </FacilitatorProtectedRoute>
          }
        />
        <Route
          path="/ginhawa-manage"
          element={
            <FacilitatorProtectedRoute>
              <GinhawaManagePage />
            </FacilitatorProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <FacilitatorProtectedRoute>
              <AppointmentsPage />
            </FacilitatorProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <FacilitatorProtectedRoute>
              <PredictiveAnalyticsPage />
            </FacilitatorProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
