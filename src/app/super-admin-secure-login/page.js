'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAppDispatch } from '@/store/hooks';
import { setCredentials, setLoading, setError, clearError } from '@/store';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash, FaShieldAlt, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';

// Simple toast notification function
const showToast = (message, type = 'error') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-fade-in ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'super_admin') {
      router.push('/superadmin');
    } else if (isAuthenticated && user && user.role !== 'super_admin') {
      // If logged in as non-super admin, redirect to their respective page
      showToast('Access denied. Super Admin only.', 'error');
      setTimeout(() => {
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user/dashboard');
        }
      }, 2000);
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors on input change
    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please fill in all required fields';
      dispatch(setError(errorMsg));
      showToast(errorMsg, 'error');
      return false;
    }

    if (formData.password.length < 8) {
      const errorMsg = 'Password must be at least 8 characters';
      dispatch(setError(errorMsg));
      showToast(errorMsg, 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    // Validate form
    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // 🔐 Secure super admin route
      const endpoint = `${API_URL}/auth/secure-admin-access/super-login-2024`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || 'Invalid credentials';
        dispatch(setError(errorMsg));
        showToast(errorMsg, 'error');
        dispatch(setLoading(false));
        return;
      }

      // Verify it's actually a super_admin
      if (data.user.role !== 'super_admin') {
        dispatch(setError('Access denied. Super Admin credentials required.'));
        showToast('Access denied. Super Admin credentials required.', 'error');
        dispatch(setLoading(false));
        return;
      }

      // Store credentials in Redux
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
      }));

      // Show success message
      showToast('Super Admin login successful!', 'success');

      // Redirect to super admin dashboard
      setTimeout(() => {
        router.push('/superadmin');
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = 'Network error. Please try again.';
      dispatch(setError(errorMsg));
      showToast(errorMsg, 'error');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4 shadow-lg">
              <FaShieldAlt className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Super Admin</h1>
            <p className="text-gray-600">Secure Access Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <FaExclamationCircle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="super@admin.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="············"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <FaLock className="w-5 h-5" />
                  Secure Login
                </>
              )}
            </button>

            {/* Warning Notice */}
            <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs text-center font-semibold flex items-center justify-center gap-2">
                <FaExclamationCircle />
                Unauthorized access is prohibited and will be logged.
              </p>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <button
            onClick={() => router.push('/login')}
            className="text-green-600 hover:text-green-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <FaArrowLeft />
            Back to Regular Login
          </button>
        </div>
      </div>
      
      {/* Toast Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}
