import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const DebugSettings = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebugTests = async () => {
      const info = {
        timestamp: new Date().toISOString(),
        user: user ? { 
          id: user._id, 
          email: user.email,
          name: user.name,
          isAuthenticated: true 
        } : { isAuthenticated: false },
        token: localStorage.getItem('token') ? 'Present' : 'Missing',
        apiBaseURL: api.defaults.baseURL,
        tests: {}
      };

      // Test 1: Settings test endpoint (no auth)
      try {
        console.log('Testing /settings/test endpoint...');
        const testResponse = await api.get('/settings/test');
        info.tests.settingsTest = { 
          success: true, 
          status: testResponse.status,
          data: testResponse.data 
        };
        console.log('Settings test successful:', testResponse.data);
      } catch (error) {
        console.error('Settings test failed:', error);
        info.tests.settingsTest = { 
          success: false, 
          status: error.response?.status,
          error: error.response?.data || error.message 
        };
      }

      // Test 2: Auth me endpoint
      try {
        console.log('Testing /auth/me endpoint...');
        const authResponse = await api.get('/auth/me');
        info.tests.authMe = { 
          success: true, 
          status: authResponse.status,
          data: { 
            id: authResponse.data._id, 
            email: authResponse.data.email,
            name: authResponse.data.name
          }
        };
        console.log('Auth me successful:', authResponse.data.email);
      } catch (error) {
        console.error('Auth me failed:', error);
        info.tests.authMe = { 
          success: false, 
          status: error.response?.status,
          error: error.response?.data || error.message 
        };
      }

      // Test 3: Settings endpoint (with auth)
      try {
        console.log('Testing /settings endpoint...');
        const settingsResponse = await api.get('/settings');
        info.tests.settings = { 
          success: true, 
          status: settingsResponse.status,
          data: {
            hasProfile: !!settingsResponse.data.profile,
            profileFields: settingsResponse.data.profile ? Object.keys(settingsResponse.data.profile) : [],
            hasSocialLinks: !!settingsResponse.data.socialLinks,
            hasSettings: !!settingsResponse.data.settings,
            settingsKeys: settingsResponse.data.settings ? Object.keys(settingsResponse.data.settings) : [],
            rawDataStructure: Object.keys(settingsResponse.data)
          }
        };
        console.log('Settings successful, data structure:', Object.keys(settingsResponse.data));
      } catch (error) {
        console.error('Settings failed:', error);
        info.tests.settings = { 
          success: false, 
          status: error.response?.status,
          error: error.response?.data || error.message,
          requestError: {
            name: error.name,
            message: error.message,
            hasResponse: !!error.response,
            hasRequest: !!error.request
          }
        };
      }

      setDebugInfo(info);
      setLoading(false);
    };

    if (user !== undefined) { // Wait for auth context to initialize
      runDebugTests();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <div className="animate-pulse">Running comprehensive debug tests...</div>
      </div>
    );
  }

  const getStatusColor = (success) => {
    return success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        Settings Debug Information
      </h2>
      
      {/* Quick Status Overview */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="p-3 bg-white dark:bg-gray-700 rounded">
          <div className="text-sm font-medium">Auth Status</div>
          <div className={getStatusColor(debugInfo.user?.isAuthenticated)}>
            {debugInfo.user?.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-700 rounded">
          <div className="text-sm font-medium">Settings API</div>
          <div className={getStatusColor(debugInfo.tests?.settings?.success)}>
            {debugInfo.tests?.settings?.success ? '✅ Working' : '❌ Failed'}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-700 rounded">
          <div className="text-sm font-medium">Token</div>
          <div className={getStatusColor(debugInfo.token === 'Present')}>
            {debugInfo.token === 'Present' ? '✅ Present' : '❌ Missing'}
          </div>
        </div>
      </div>

      {/* Detailed Debug Info */}
      <details className="mb-4">
        <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
          Detailed Debug Information (Click to expand)
        </summary>
        <pre className="text-xs bg-white dark:bg-gray-900 p-4 rounded overflow-auto max-h-96 border">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>

      {/* Error Specific Help */}
      {!debugInfo.tests?.settings?.success && (
        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">
            Settings API Error Detected
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            The settings endpoint is failing. Check the detailed information above for the specific error.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugSettings;