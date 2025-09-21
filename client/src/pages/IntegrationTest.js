import React, { useState } from 'react';
import api from '../utils/api';

const IntegrationTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    try {
      let response;
      const config = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      switch (method) {
        case 'GET':
          response = await api.get(endpoint, config);
          break;
        case 'POST':
          response = await api.post(endpoint, data, config);
          break;
        default:
          throw new Error('Unsupported method');
      }

      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          success: true,
          status: response.status,
          data: response.data
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          success: false,
          status: error.response?.status || 'NETWORK_ERROR',
          error: error.response?.data?.message || error.message,
          fullError: error
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setTestResults({});
    
    // Test basic endpoints
    await testEndpoint('/health');
    await testEndpoint('/integrations/status');
    
    // Test connection endpoint
    await testEndpoint('/integrations/connect/leetcode', 'POST', { username: 'test' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Integration API Test</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run API Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div key={endpoint} className="border p-4 rounded">
            <h3 className="font-bold text-lg mb-2">{endpoint}</h3>
            <div className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <p><strong>Status:</strong> {result.status}</p>
              {result.success ? (
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              ) : (
                <div>
                  <p><strong>Error:</strong> {result.error}</p>
                  <details className="mt-2">
                    <summary>Full Error Details</summary>
                    <pre className="text-xs mt-1">
                      {JSON.stringify(result.fullError, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationTest;