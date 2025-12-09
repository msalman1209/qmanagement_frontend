import axios from 'axios';
import { getToken } from './sessionStorage';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    // Only add Authorization header if token exists and is not null/undefined
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Allow login/health endpoints without token
      if (config.url.includes('/login') || 
          config.url.includes('/health') || 
          config.url.includes('/register')) {
        return config;
      }
      
      // For other endpoints, warn but still send request
      // The backend will respond with 401/403 which the response interceptor will handle
      console.warn('⚠️ No valid token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('🔒 Authentication failed - redirecting to login');
      // Clear invalid session
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
