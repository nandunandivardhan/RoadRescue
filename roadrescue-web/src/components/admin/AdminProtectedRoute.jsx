import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../../services/adminAuthService';

const AdminProtectedRoute = ({ children }) => {
  const session = getAdminSession();

  // If no active administrative session, redirect to the Admin LoginPage
  if (!session) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
