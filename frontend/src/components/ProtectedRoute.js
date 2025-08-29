import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Access Denied</div>;
  }

  return children;
};

export default ProtectedRoute;