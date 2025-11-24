'use client';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store';
import { useState } from 'react';

// Helper to delete cookies
const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

export default function LogoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      // Call backend logout
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all authentication data
      dispatch(logout());
      
      // Clear cookies manually as well
      deleteCookie('isAuthenticated');
      deleteCookie('userRole');
      deleteCookie('token');
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-700 mb-4">Logout</h1>
        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Yes, Logout'
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
