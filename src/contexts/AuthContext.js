'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useReduxAuth, useAppDispatch } from '@/store/hooks';
import { logout as reduxLogout, setCredentials } from '@/store';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useReduxAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState(null);

  // Validate session every 5 minutes
  const validateSession = useCallback(async () => {
    if (!token || !isAuthenticated) {
      return { valid: false };
    }

    // Don't validate too frequently (max once per minute)
    const now = Date.now();
    if (lastValidation && (now - lastValidation) < 60000) {
      return { valid: true };
    }

    setIsValidating(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('❌ Session validation failed');
        dispatch(reduxLogout());
        router.push('/login');
        return { valid: false };
      }

      const data = await response.json();

      // Check for license expiry
      if (data.license_expired) {
        alert('Your license has expired. Please contact support.');
        dispatch(reduxLogout());
        router.push('/login');
        return { valid: false, expired: true };
      }

      // Update last validation time
      setLastValidation(now);

      return { valid: true, data };
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return { valid: false, error };
    } finally {
      setIsValidating(false);
    }
  }, [token, isAuthenticated, lastValidation, dispatch, router]);

  // DISABLED: Auto-validation causes data clearing issues
  // Only validate when explicitly called, not on mount
  useEffect(() => {
    // Don't auto-validate - let SessionValidator and axiosInstance handle it
    console.log('🔵 AuthContext: Auto-validation disabled');
    return () => {
      // No cleanup needed
    };
  }, [isAuthenticated, token]);

  // Validate on tab/window focus (skip on login page)
  useEffect(() => {
    const handleFocus = () => {
      // Don't validate on login page
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        return;
      }
      
      if (isAuthenticated && token) {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, token, validateSession]);

  // Handle logout
  const logout = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Call backend logout if token exists
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('Logout API error:', err));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(reduxLogout());
      router.push('/login');
    }
  }, [token, dispatch, router]);

  // Make authenticated API calls
  const callAPI = useCallback(async (endpoint, options = {}) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    // Validate session before API call for critical operations
    if (options.validateSession !== false) {
      const validation = await validateSession();
      if (!validation.valid) {
        throw new Error('Session invalid or expired');
      }
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    try {
      const fetchOptions = {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Stringify body if it's an object
      if (options.body && typeof options.body === 'object') {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      const data = await response.json();

      // Handle auth/license errors
      if (response.status === 401 || response.status === 403) {
        if (data.session_expired) {
          alert('Your session has expired. Please login again.');
          logout();
          throw new Error('Session expired');
        }
        
        if (data.license_expired) {
          alert('Your license has expired. Please renew to continue.');
          logout();
          throw new Error('License expired');
        }
      }

      // Handle limit errors
      if (data.limit_reached) {
        throw new Error(data.message || 'Limit reached');
      }

      if (!response.ok) {
        throw new Error(data.message || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, [token, validateSession, logout]);

  const value = {
    isAuthenticated,
    user,
    token,
    isValidating,
    validateSession,
    logout,
    callAPI,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
