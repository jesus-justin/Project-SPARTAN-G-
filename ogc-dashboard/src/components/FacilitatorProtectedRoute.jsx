import { Navigate, useLocation } from 'react-router-dom';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

export default function FacilitatorProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useFacilitatorAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
