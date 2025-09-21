import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import api from '../../utils/api';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        // Store token and set up API headers
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user data
        await fetchUser();
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // No token found, redirect to login
        navigate('/auth/login', { replace: true });
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;