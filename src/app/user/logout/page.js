'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store';

export default function UserLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const performLogout = async () => {
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
        // Clear Redux state and localStorage
        dispatch(logout());
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      }
    };
    
    performLogout();
  }, [router, dispatch]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Logging out...</h2>
        <p className="text-gray-600">Please wait while we log you out securely.</p>
      </div>
    </div>
  );
}
