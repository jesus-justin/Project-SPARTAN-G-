import { Navigate, useLocation } from 'react-router-dom';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

export default function FacilitatorProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useFacilitatorAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
