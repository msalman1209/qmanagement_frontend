'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store';

/**
 * Authentication validator hook
 * Validates user session and token on every page
 */
export const useAuthValidator = (requiredRole = null) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    const validateAuth = async () => {
      // Check if user is authenticated
      if (!isAuthenticated || !token || !user) {
        console.warn('❌ No valid authentication found');
        dispatch(logout());
        router.push('/login');
        return;
      }

      // Verify token with backend
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
          console.warn('❌ Token validation failed');
          dispatch(logout());
          router.push('/login');
          return;
        }

        const data = await response.json();

        // Check if license is expired (for admins)
        if (data.license_expired) {
          alert('Your license has expired. Please contact support.');
          dispatch(logout());
          router.push('/login');
          return;
        }

        // Validate role if required
        if (requiredRole && user.role !== requiredRole) {
          console.warn(`❌ Access denied. Required role: ${requiredRole}, User role: ${user.role}`);
          const roleMapping = {
            'super_admin': 'superadmin',
            'admin': 'admin',
            'user': 'user'
          };
          const mappedRole = roleMapping[user.role] || 'user';
          router.push(`/${mappedRole}`);
          return;
        }

      } catch (error) {
        console.error('❌ Auth validation error:', error);
        dispatch(logout());
        router.push('/login');
      }
    };

    validateAuth();
  }, [isAuthenticated, token, user, requiredRole, router, dispatch]);

  return { isAuthenticated, user, token };
};

/**
 * License validator hook
 * Checks if admin's license is valid before performing operations
 */
export const useLicenseValidator = () => {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const validateLicense = async () => {
    if (!user || user.role === 'user' || user.role === 'super_admin') {
      return { valid: true };
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.license_expired) {
        alert('Your license has expired. Please renew to continue.');
        dispatch(logout());
        router.push('/login');
        return { valid: false, message: 'License expired' };
      }

      return { valid: true, data };
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, message: 'License validation failed' };
    }
  };

  return { validateLicense };
};

/**
 * API call wrapper with automatic authentication and license validation
 */
export const useAuthenticatedAPI = () => {
  const { token } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const callAPI = async (endpoint, options = {}) => {
    if (!token) {
      dispatch(logout());
      router.push('/login');
      throw new Error('No authentication token');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        if (data.session_expired || data.license_expired) {
          const message = data.license_expired 
            ? 'Your license has expired. Please renew to continue.' 
            : 'Your session has expired. Please login again.';
          
          alert(message);
          dispatch(logout());
          router.push('/login');
          throw new Error(message);
        }
      }

      // Handle limit reached errors
      if (data.limit_reached) {
        alert(data.message);
        throw new Error(data.message);
      }

      if (!response.ok) {
        throw new Error(data.message || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  return { callAPI };
};
