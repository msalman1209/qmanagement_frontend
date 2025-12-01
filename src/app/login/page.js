'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useAppDispatch } from '@/store/hooks';
import { setCredentials, setLoading, setError, clearError } from '@/store';
import CounterSelectionModal from '@/Components/CounterSelectionModal';

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
  const { isAuthenticated, user, loading, error } = useAuth();
  
  const [activeTab, setActiveTab] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      // Admin and super_admin go to their dashboards
      const roleMapping = {
        'super_admin': '/superadmin',
        'admin': '/admin',
        'user': '/user/dashboard',  // User with counter goes to dashboard
        'receptionist': '/',  // Receptionist goes to main page
      };
      const redirectPath = roleMapping[user.role];
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, user, router]);

  // Clear errors on tab switch
  useEffect(() => {
    dispatch(clearError());
    setFormData({ email: '', password: '' });
  }, [activeTab, dispatch]);

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

    if (formData.password.length < 3) {
      const errorMsg = 'Password must be at least 3 characters';
      dispatch(setError(errorMsg));
      showToast(errorMsg, 'error');
      return false;
    }

    return true;
  };

  const handleCounterSelect = async (counterNo) => {
    if (!pendingUserData) return;

    dispatch(setLoading(true));
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/user/set-counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingUserData.token}`
        },
        body: JSON.stringify({ counter_no: counterNo }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to assign counter', 'error');
        dispatch(setLoading(false));
        return;
      }

      // Store credentials with counter
      dispatch(setCredentials({
        user: { ...pendingUserData.user, counter_no: counterNo },
        token: pendingUserData.token,
      }));

      showToast('Counter assigned successfully!', 'success');
      setShowCounterModal(false);
      setPendingUserData(null);
      
      // Let useEffect handle redirect
    } catch (err) {
      console.error('Counter assignment error:', err);
      showToast('Failed to assign counter', 'error');
    } finally {
      dispatch(setLoading(false));
    }
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
      let endpoint = '';
      let loginData = { email: formData.email, password: formData.password };
      
      if (activeTab === 'user') {
        endpoint = `${API_URL}/auth/user/login`;
        // User login without counter - will select counter in modal
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
          let errorMsg = data.message || 'Invalid credentials';
          
          // Handle license specific errors
          if (data.license_expired) {
            if (data.no_license) {
              errorMsg = '❌ No license assigned to your account.\n\n📧 Click "Contact Q Tech Support" link above to request a license.';
            } else if (data.license_info) {
              const license = data.license_info;
              errorMsg = `❌ Your license has expired!\n\n` +
                        `License Type: ${license.license_type}\n` +
                        `Expired on: ${new Date(license.expiry_date).toLocaleDateString()}\n\n` +
                        `📧 Click "Contact Q Tech Support" link above to renew your license.`;
            } else {
              errorMsg = '❌ Your license has expired or is invalid.\n\n📧 Click "Contact Q Tech Support" link above for assistance.';
            }
          }
          
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          dispatch(setLoading(false));
          return;
        }

        // Store credentials in Redux and sessionStorage
        dispatch(setCredentials({
          user: data.user,
          token: data.token,
        }));

        // Show success message
        showToast('Login successful!', 'success');

        // Let useEffect handle redirect after state update
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
        let errorMsg = data.message || 'Login failed';
        
        // Handle license specific errors for users whose admin license expired
        if (data.license_expired) {
          if (data.admin_info) {
            errorMsg = `❌ Admin license has expired!\n\n` +
                      `Admin: ${data.admin_info.username}\n` +
                      `Email: ${data.admin_info.email}\n\n` +
                      `📧 Contact your admin or click "Contact Q Tech Support" above.`;
          } else {
            errorMsg = '❌ Admin license has expired!\n\n📧 Click "Contact Q Tech Support" link above for assistance.';
          }
        }
        
        dispatch(setError(errorMsg));
        showToast(errorMsg, 'error');
        dispatch(setLoading(false));
        return;
      }

      // Show counter modal only for users with role='user' (not receptionist)
      if (activeTab === 'user' && data.user.role === 'user') {
        setPendingUserData({
          user: data.user,
          token: data.token,
        });
        setShowCounterModal(true);
        dispatch(setLoading(false));
        return;
      }

      // For receptionist and other roles, store credentials directly (no counter needed)
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
      }));

      // Show success message
      showToast('Login successful!', 'success');

      // Let useEffect handle redirect after state update
    } catch (err) {
      console.error('Login error:', err);
      // Don't set loading to false here, let finally block handle it
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
            <div className="flex flex-col items-center mb-6">
              <Link href="/" className="text-2xl font-bold text-gray-800 mb-3">
                Q Management
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline whitespace-pre-line">{error}</span>
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

      {/* Counter Selection Modal */}
      <CounterSelectionModal
        isOpen={showCounterModal}
        onClose={() => {
          setShowCounterModal(false);
          setPendingUserData(null);
          dispatch(setLoading(false));
        }}
        adminId={pendingUserData?.user?.admin_id}
        token={pendingUserData?.token}
        onCounterSelect={handleCounterSelect}
      />
    </div>
  );
}
