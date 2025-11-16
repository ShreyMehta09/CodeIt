import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('=== AdminRoute Check ===');
  console.log('Loading:', loading);
  console.log('User exists:', !!user);
  console.log('User data:', user);
  console.log('Username:', user?.username);
  console.log('Role:', user?.role);
  console.log('Location:', location.pathname);
  console.log('========================');

  if (loading) {
    console.log('AdminRoute - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log('AdminRoute - No user found, redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check both username and role for admin access
  const isAdmin = user.username === 'admin' || user.role === 'admin';
  
  console.log('Is Admin Check:', isAdmin);
  
  if (!isAdmin) {
    console.log('AdminRoute - User is not admin, redirecting to dashboard');
    console.log('AdminRoute - Username:', user.username, 'Role:', user.role);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AdminRoute - User is admin, rendering children');
  return children;
};

export default AdminRoute;
