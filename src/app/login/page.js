'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useAppDispatch } from '@/store/hooks';
import { setCredentials, setLoading, setError, clearError } from '@/store';

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

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAuth();
  
  const [activeTab, setActiveTab] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    counter_no: '1',
  });

  const counters = Array.from({ length: 11 }, (_, i) => i + 1);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roleMapping = {
        'super_admin': 'superadmin',
        'admin': 'admin',
        'user': 'user'
      };
      const mappedRole = roleMapping[user.role] || 'user';
      router.push(`/${mappedRole}`);
    }
  }, [isAuthenticated, router]);

  // Clear errors on tab switch
  useEffect(() => {
    dispatch(clearError());
    setFormData({ email: '', password: '', counter_no: '1' });
  }, [activeTab, dispatch]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(setLoading(true));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      let endpoint = '';
      let loginData = { email: formData.email, password: formData.password };
      
      if (activeTab === 'user') {
        endpoint = `${API_URL}/auth/user/login`;
        loginData.counter_no = formData.counter_no; // User needs counter
      } else if (activeTab === 'admin') {
        // First try super admin login
        endpoint = `${API_URL}/auth/super-admin/login`;
        
        let response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

        // If super admin login fails, try regular admin login
        if (!response.ok) {
          endpoint = `${API_URL}/auth/admin/login`;
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
          });
        }

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.message || 'Invalid credentials';
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        // Store credentials in Redux and localStorage
        dispatch(setCredentials({
          user: data.user,
          token: data.token,
        }));

        // Show success message
        showToast('Login successful!', 'success');

        // Redirect based on role
        setTimeout(() => {
          const roleMapping = {
            'super_admin': 'superadmin',
            'admin': 'admin',
            'user': 'user'
          };
          const mappedRole = roleMapping[data.user.role] || 'admin';
          router.push(`/${mappedRole}`);
        }, 500);
        
        dispatch(setLoading(false));
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || 'Login failed';
        dispatch(setError(errorMsg));
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      // Store credentials in Redux and localStorage
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
      }));

      // Show success message
      showToast('Login successful!', 'success');

      // Redirect based on role
      setTimeout(() => {
        const roleMapping = {
          'super_admin': 'superadmin',
          'admin': 'admin',
          'user': 'user'
        };
        const mappedRole = roleMapping[data.user.role] || 'user';
        router.push(`/${mappedRole}`);
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link href="/" className="text-2xl font-bold text-gray-800">
                Q Management
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
                <button
                  onClick={() => dispatch(clearError())}
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                >
                  <span className="text-red-700 text-xl">&times;</span>
                </button>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('user')}
                disabled={loading}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'user'
                    ? 'bg-green-600 text-white border-b-2 border-green-600'
                    : 'text-green-900 hover:bg-green-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                User Login
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                disabled={loading}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-green-600 text-white border-b-2 border-green-600'
                    : 'text-green-900 hover:bg-green-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Admin Login
              </button>
            </div>

            {/* User Login Form */}
            {activeTab === 'user' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">User Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email or Username
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email or username"
                      required
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="············"
                        required
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="counter_no" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Counter
                    </label>
                    <select
                      id="counter_no"
                      name="counter_no"
                      value={formData.counter_no}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {counters.map((counter) => (
                        <option key={counter} value={counter}>
                          Counter {counter}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email or Username
                    </label>
                    <input
                      type="text"
                      id="admin_email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email or username"
                      required
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        id="admin_password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="············"
                        required
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        {showAdminPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
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
