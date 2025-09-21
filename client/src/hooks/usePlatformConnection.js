import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const usePlatformConnection = () => {
  const [loading, setLoading] = useState(false);

  const initiateConnection = async (platform, username) => {
    setLoading(true);
    try {
      console.log('Making API call to:', `/integrations/connect/${platform}`);
      const response = await api.post(`/integrations/connect/${platform}`, {
        username: username
      });
      
      toast.success(`Verification code generated for ${platform}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error response:', error.response);
      
      let message = 'Failed to initiate connection';
      
      if (error.code === 'ECONNREFUSED') {
        message = 'Cannot connect to server. Please ensure the backend server is running on port 5000.';
      } else if (error.response) {
        message = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'No response from server. Please check if the backend is running.';
      } else {
        message = error.message;
      }
      
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyConnection = async (platform, username) => {
    setLoading(true);
    try {
      const response = await api.post(`/integrations/verify/${platform}`, {
        username: username
      });
      
      toast.success(`${platform} connected successfully!`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectPlatform = async (platform) => {
    setLoading(true);
    try {
      const response = await api.post(`/integrations/disconnect/${platform}`);
      
      toast.success(`${platform} disconnected successfully`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to disconnect platform';
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = async () => {
    try {
      const response = await api.get('/integrations/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
      return {};
    }
  };

  const syncPlatform = async (platform, handle) => {
    setLoading(true);
    try {
      const response = await api.post(`/integrations/sync/${platform}`, {
        handle: handle
      });
      
      toast.success(`${platform} synced successfully!`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Sync failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    initiateConnection,
    verifyConnection,
    disconnectPlatform,
    getIntegrationStatus,
    syncPlatform
  };
};

export default usePlatformConnection;