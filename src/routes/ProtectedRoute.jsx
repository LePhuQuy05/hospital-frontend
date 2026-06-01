import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LoadingState from '../components/LoadingState';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
