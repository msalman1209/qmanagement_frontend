'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const validateAuth = async () => {
      try {
        // Check authentication
        if (!isAuthenticated || !token || !user) {
          console.warn('❌ No valid authentication found');
          dispatch(logout());
          router.push('/login');
          return;
        }

        // Verify token with backend
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
          setValidationError('Your license has expired. Please contact support to renew.');
          setTimeout(() => {
            dispatch(logout());
            router.push('/login');
          }, 3000);
          return;
        }

        // Check role-based access
        if (allowedRoles.length > 0 && user) {
          const hasAccess = allowedRoles.includes(user.role);
          
          if (!hasAccess) {
            setIsChecking(false);
            return;
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error('❌ Auth validation error:', error);
        dispatch(logout());
        router.push('/login');
      }
    };

    const timer = setTimeout(validateAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, token, allowedRoles, router, mounted, dispatch]);

  // Show validation error (license expired, etc.)
  if (validationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">License Expired</h2>
          <p className="text-gray-700 mb-4">{validationError}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading only on initial mount
  if (!mounted || (isChecking && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  // Don't show loading if we already have user data (prevents flash on refresh)
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Check role access
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-2">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-6">Required role: {allowedRoles.join(', ')}</p>
          <button
            onClick={() => {
              const roleMapping = {
                'super_admin': 'superadmin',
                'admin': 'admin',
                'user': 'user'
              };
              const mappedRole = roleMapping[user.role] || 'user';
              router.push(`/${mappedRole}`);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
