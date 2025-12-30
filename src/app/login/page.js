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
  const [showReceptionistPassword, setShowReceptionistPassword] = useState(false);
  const [showTicketInfoPassword, setShowTicketInfoPassword] = useState(false);
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

      console.log('✅ Counter assigned, new token received:', !!data.token);

      // Store credentials with counter AND NEW TOKEN from session creation
      dispatch(setCredentials({
        user: { ...pendingUserData.user, counter_no: counterNo },
        token: data.token || pendingUserData.token,  // Use new token with session
      }));

      showToast('Counter assigned successfully!', 'success');
      setShowCounterModal(false);
      setPendingUserData(null);
      
      // Redirect immediately to user dashboard
      router.push('/user/dashboard');
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
      
      // Handle Receptionist Login
      if (activeTab === 'receptionist') {
        loginData = { username: formData.email, password: formData.password };
        endpoint = `${API_URL}/auth/receptionist/login`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMsg = data.message || 'Invalid credentials';
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          dispatch(setLoading(false));
          return;
        }

        // Check role
        if (data.user.role !== 'receptionist') {
          const errorMsg = 'Access denied. Only Receptionist users can login here.';
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          dispatch(setLoading(false));
          return;
        }

        // Store credentials
        dispatch(setCredentials({
          user: data.user,
          token: data.token,
        }));

        showToast('Login successful!', 'success');
        router.push('/');
        dispatch(setLoading(false));
        return;
      }

      // Handle Ticket Info Login
      if (activeTab === 'ticketinfo') {
        loginData = { username: formData.email, password: formData.password };
        endpoint = `${API_URL}/auth/ticket-info/login`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMsg = data.message || 'Invalid credentials';
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          dispatch(setLoading(false));
          return;
        }

        // Check role
        if (data.user.role !== 'ticket_info') {
          const errorMsg = 'Access denied. Only Ticket Info users can login here.';
          dispatch(setError(errorMsg));
          showToast(errorMsg, 'error');
          dispatch(setLoading(false));
          return;
        }

        // Store credentials
        dispatch(setCredentials({
          user: data.user,
          token: data.token,
        }));

        // Fetch screen configuration
        try {
          const configResponse = await fetch(`${API_URL}/counter-display/config`, {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          
          const configData = await configResponse.json();
          
          if (configData.success && configData.config) {
            const screenType = configData.config.screen_type;
            showToast('Login successful!', 'success');
            
            if (screenType === 'horizontal') {
              window.location.href = '/ticket_info_horizontal';
            } else {
              window.location.href = '/ticket_info_vertical';
            }
          } else {
            showToast('Login successful!', 'success');
            window.location.href = '/ticket_info_vertical';
          }
        } catch (configError) {
          console.error('Config fetch error:', configError);
          showToast('Login successful!', 'success');
          window.location.href = '/ticket_info_vertical';
        }
        
        dispatch(setLoading(false));
        return;
      }
      
      if (activeTab === 'user') {
        endpoint = `${API_URL}/auth/user/login`;
        // User login - only 'user' role allowed
      } else if (activeTab === 'admin') {
        // Admin login - only 'admin' role allowed (super_admin has separate route)
        endpoint = `${API_URL}/auth/admin/login`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

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

        // ✅ Role validation for Admin tab - only 'admin' role allowed
        if (data.user.role !== 'admin') {
          const errorMsg = 'Invalid credentials';
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

        // Redirect to admin dashboard
        if (data.user.role === 'admin') {
          router.push('/admin');
        }
        
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

      console.log('Login response data:', data);
      console.log('User role:', data.user.role);
      console.log('Active tab:', activeTab);

      // ✅ Role validation for User tab - only 'user' role allowed
      if (activeTab === 'user' && data.user.role !== 'user') {
        const errorMsg = 'Invalid credentials';
        dispatch(setError(errorMsg));
        showToast(errorMsg, 'error');
        dispatch(setLoading(false));
        return;
      }

      // Show counter modal only for users with role='user' (not receptionist)
      if (activeTab === 'user' && data.user.role === 'user') {
        console.log('Showing counter modal for regular user');
        setPendingUserData({
          user: data.user,
          token: data.token,
        });
        setShowCounterModal(true);
        dispatch(setLoading(false));
        return;
      }

      // For receptionist and other roles, store credentials directly (no counter needed)
      console.log('Storing credentials for role:', data.user.role);
      
      // Store in Redux (which sets cookies)
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
      }));

      // Show success message
      showToast('Login successful!', 'success');

      // Redirect based on role
      const roleMapping = {
        'receptionist': '/',
        'user': '/user/dashboard',
      };
      const redirectPath = roleMapping[data.user.role];
      console.log('Redirecting to:', redirectPath);
      
      if (redirectPath) {
        // Use window.location for hard redirect to ensure cookies are read
        console.log('Using window.location.href for redirect');
        window.location.href = redirectPath;
      } else {
        console.warn('No redirect path found for role:', data.user.role);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Don't set loading to false here, let finally block handle it
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
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Q Management</h1>
            <p className="text-gray-600">Login to access your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold whitespace-pre-line flex-1">{error}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="text-red-700 hover:text-red-900 text-xl leading-none"
              >
                &times;
              </button>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="mb-6 space-y-2">
            {/* First Row - User & Admin */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setActiveTab('user')}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition-all ${
                  activeTab === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                User Login
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Admin Login
              </button>
            </div>

            {/* Second Row - Receptionist & Ticket Info */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setActiveTab('receptionist')}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition-all ${
                  activeTab === 'receptionist'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Receptionist Login
              </button>
              <button
                onClick={() => setActiveTab('ticketinfo')}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition-all ${
                  activeTab === 'ticketinfo'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Ticket Info Login
              </button>
            </div>
          </div>

            {/* User Login Form */}
            {activeTab === 'user' && (
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email or Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                        placeholder="Enter your email or username"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign in
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email or Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                        placeholder="Enter your email or username"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
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
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showAdminPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign in
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Receptionist Login Form */}
            {activeTab === 'receptionist' && (
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                        placeholder="Enter your username"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showReceptionistPassword ? 'text' : 'password'}
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
                        onClick={() => setShowReceptionistPassword(!showReceptionistPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showReceptionistPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign in
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Ticket Info Login Form */}
            {activeTab === 'ticketinfo' && (
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                        placeholder="Enter your username"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showTicketInfoPassword ? 'text' : 'password'}
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
                        onClick={() => setShowTicketInfoPassword(!showTicketInfoPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showTicketInfoPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign in
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
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
