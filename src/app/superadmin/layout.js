'use client';

import Sidebar from '@/Components/Sidebar';
import ProtectedRoute from '@/Components/ProtectedRoute';

export default function SuperAdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          {/* Footer */}
          <div className="py-4 px-8 bg-gray-50">
            <p className="text-xs text-gray-500 ">
              © 2025 , made with ❤️ by <span className="font-semibold text-gray-700">TechSoulutionor</span>
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
