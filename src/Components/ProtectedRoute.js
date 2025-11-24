'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/hooks';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Small delay to allow Redux to restore from localStorage
    const timer = setTimeout(() => {
      const checkAuth = () => {
        // Check authentication
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        // Check role-based access
        if (allowedRoles.length > 0 && user) {
          const hasAccess = allowedRoles.includes(user.role);
          
          if (!hasAccess) {
            // Don't redirect - just show access denied
            setIsChecking(false);
            return;
          }
        }

        setIsChecking(false);
      };

      checkAuth();
    }, 100); // Small delay to ensure Redux state is hydrated

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, allowedRoles, router, mounted]);

  // Show loading only on initial mount
  if (!mounted || (isChecking && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
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
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
