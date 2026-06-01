import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import ForbiddenPage from '../pages/ForbiddenPage';

const RoleGuard = ({ allowedRoles = [], children }) => {
  const { roles } = useAuth();

  const isAllowed = useMemo(
    () => allowedRoles.length === 0 || roles.some((role) => allowedRoles.includes(role)),
    [allowedRoles, roles]
  );

  if (!isAllowed) {
    return <ForbiddenPage />;
  }

  return children;
};

export default RoleGuard;
