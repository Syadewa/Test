
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ROLE_DASHBOARD_PATHS } from '../constants';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-smkn-blue"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard or a general access denied page
    const userDashboard = ROLE_DASHBOARD_PATHS[user.role] || '/login';
    return <Navigate to={userDashboard} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
    