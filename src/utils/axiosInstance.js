import axios from 'axios';
import { getToken, verifySessionWithBackend, clearSessionData } from './sessionStorage';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 300000, // 5 minutes timeout for large file uploads (video files)
  headers: {
    'Content-Type': 'application/json',
    // Note: Accept-Encoding is automatically handled by the browser
    // Setting it manually causes "Refused to set unsafe header" warnings
  },
  // Performance optimizations
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  decompress: true, // Auto decompress responses - browser handles encoding automatically
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
    
    // CRITICAL: Remove Content-Type header for FormData requests
    // Let the browser set it automatically with the boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('📤 FormData detected - removing Content-Type header to allow multipart/form-data');
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
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('🔒 Authentication failed - verifying session with backend');
      
      // ✅ CRITICAL: Verify with backend before clearing session data
      // Only clear and redirect if backend confirms session is invalid
      try {
        const sessionCheck = await verifySessionWithBackend();
        
        if (sessionCheck.valid) {
          // Backend says session is valid - don't clear anything
          console.log('✅ Session is still valid on backend, keeping user logged in');
          // Return the original error to let component handle it
          return Promise.reject(error);
        } else {
          // Backend confirms session is invalid - clear and redirect
          console.error('❌ Backend confirmed session is invalid - logging out');
          if (typeof window !== 'undefined') {
            clearSessionData();
            window.location.href = '/login';
          }
        }
      } catch (verifyError) {
        console.error('❌ Failed to verify session, clearing data:', verifyError);
        // If verification fails, assume session is invalid for security
        if (typeof window !== 'undefined') {
          clearSessionData();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
