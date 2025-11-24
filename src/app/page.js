'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Redirect to appropriate dashboard
        if (user.role === 'super_admin' || user.role === 'admin') {
          router.push('/superadmin');
        } else if (user.role === 'user') {
          router.push('/user');
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <main className="text-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Queue Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Efficient queue management for better customer service
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-md"
            >
              Get Started
            </Link>
            <Link
              href="/ticket_info"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              View Ticket Info
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-800 mb-2">User Management</h3>
              <p className="text-sm text-gray-600">Manage users and assign services efficiently</p>
            </div>
            <div className="p-4">
              <div className="text-4xl mb-2">🎫</div>
              <h3 className="font-semibold text-gray-800 mb-2">Ticket System</h3>
              <p className="text-sm text-gray-600">Track and manage customer tickets</p>
            </div>
            <div className="p-4">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Reports</h3>
              <p className="text-sm text-gray-600">Generate detailed reports and analytics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
