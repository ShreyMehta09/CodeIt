import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request ID for tracking
let requestId = 0;

// Request interceptor to add auth token and request tracking
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for debugging
    config.metadata = { requestId: ++requestId, startTime: Date.now() };
    console.log(`[API Request ${config.metadata.requestId}] ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and retries
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`[API Response ${response.config.metadata.requestId}] ${response.status} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const config = error.config;
    
    if (config) {
      const duration = Date.now() - config.metadata.startTime;
      console.error(`[API Error ${config.metadata.requestId}] ${error.message} (${duration}ms)`);
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('[Auth] Token expired or invalid, redirecting to login');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }
    
    // Retry logic for network errors or 5xx errors
    if (
      (!error.response || error.response.status >= 500) &&
      config &&
      !config._retry &&
      !config.url?.includes('/test') // Don't retry test endpoints
    ) {
      config._retry = true;
      console.log(`[Retry] Retrying request ${config.metadata.requestId} in 1 second...`);
      
      return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), 1000);
      });
    }
    
    // Add more context to the error
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your internet connection.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

export default api;