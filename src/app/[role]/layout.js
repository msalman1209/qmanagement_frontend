'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/Components/Sidebar';
import UserSidebar from '@/Components/UserSidebar';
import ProtectedRoute from '@/Components/ProtectedRoute';

/**
 * Dynamic Role Layout
 * Handles layout for all user roles with appropriate sidebar
 * 
 * Route: /[role]/*
 * Where [role] can be: superadmin, admin, user
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Promise<Object>} props.params - Route parameters (Promise in Next.js 15+)
 * @param {string} props.params.role - Dynamic role from URL
 */
export default function DynamicRoleLayout({ children, params }) {
  const router = useRouter();
  // Unwrap params Promise using React.use()
  const { role } = use(params);

  // Validate role parameter
  const validRoles = ['superadmin', 'admin', 'user'];
  const isValidRole = validRoles.includes(role);

  useEffect(() => {
    if (!isValidRole) {
      console.error(`Invalid role: ${role}`);
      router.push('/login');
    }
  }, [role, isValidRole, router]);

  if (!isValidRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600 font-medium">Invalid role. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Determine allowed roles based on route
  const getAllowedRoles = (routeRole) => {
    switch (routeRole) {
      case 'superadmin':
        return ['super_admin']; // Only super_admin can access
      case 'admin':
        return ['admin', 'super_admin']; // Both admin and super_admin can access
      case 'user':
        return ['user'];
      default:
        return [];
    }
  };

  // Determine which sidebar to use
  const renderSidebar = () => {
    if (role === 'user') {
      return <UserSidebar />;
    }
    // Both superadmin and admin use the same sidebar
    return <Sidebar />;
  };

  // Determine layout style based on role
  const isUserRole = role === 'user';

  return (
    <ProtectedRoute allowedRoles={getAllowedRoles(role)}>
      {isUserRole ? (
        // User Layout Style
        <div className="flex h-screen bg-gray-50">
          {renderSidebar()}
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-600 text-right">
                © 2025 Tech Solutionor. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      ) : (
        // Admin/SuperAdmin Layout Style
        <div className="flex min-h-screen bg-gray-50">
          {renderSidebar()}
          <main className="flex-1 flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            {/* Footer */}
            <div className="py-4 px-8 bg-gray-50">
              <p className="text-xs text-gray-500">
                © 2025 , made with ❤️ by <span className="font-semibold text-gray-700">TechSolutionor</span>
              </p>
            </div>
          </main>
        </div>
      )}
    </ProtectedRoute>
  );
}
