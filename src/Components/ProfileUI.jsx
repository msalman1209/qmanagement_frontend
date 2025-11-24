'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { updateOwnProfile } from '@/store/thunks';
import { updateUser } from '@/store/slices/authSlice';
import { Eye, EyeOff, User, Mail, Lock, Shield, Save } from 'lucide-react';

/**
 * ProfileUI Component
 * A reusable profile management component for all user roles
 * Supports: superadmin, admin, user
 * 
 * @param {Object} props
 * @param {string} props.role - Current user role (superadmin | admin | user)
 */
export default function ProfileUI({ role }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Load current user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        password: '',
      });
    }
  }, [currentUser]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      showToast('error', 'Username is required');
      return false;
    }

    if (!formData.email.trim()) {
      showToast('error', 'Email is required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('error', 'Please enter a valid email address');
      return false;
    }

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      showToast('error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) {
      showToast('error', 'User not found. Please log in again.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Confirm profile update
    const confirmUpdate = window.confirm(
      'Are you sure you want to update your profile?'
    );
    
    if (!confirmUpdate) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      // Call the API to update own profile
      const result = await dispatch(
        updateOwnProfile(updateData)
      ).unwrap();

      // Update the user in Redux state
      dispatch(updateUser({
        username: updateData.username,
        email: updateData.email,
      }));

      showToast('success', 'Profile updated successfully!');
      
      // Clear password field after successful update
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      showToast('error', error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Role-based permissions and display
  const getRoleConfig = () => {
    const configs = {
      superadmin: {
        title: 'Super Admin Profile',
        roleDisplay: 'Super Administrator',
        accentColor: 'purple',
        permissions: ['full_access', 'manage_admins', 'system_config'],
        canEditEmail: true,
        canEditUsername: true,
        canChangePassword: true,
      },
      admin: {
        title: 'Admin Profile',
        roleDisplay: 'Administrator',
        accentColor: 'blue',
        permissions: ['manage_users', 'manage_services', 'view_reports'],
        canEditEmail: true,
        canEditUsername: true,
        canChangePassword: true,
      },
      user: {
        title: 'User Profile',
        roleDisplay: 'User',
        accentColor: 'green',
        permissions: ['view_dashboard', 'manage_tickets'],
        canEditEmail: true,
        canEditUsername: true,
        canChangePassword: true,
      },
    };

    return configs[role] || configs.user;
  };

  const roleConfig = getRoleConfig();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 min-w-[300px] ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast({ show: false, type: '', message: '' })}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-gray-700" />
          {roleConfig.title}
        </h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* User Info Card */}
      {currentUser && (
        <div className={`max-w-4xl mx-auto mb-6 bg-gradient-to-r from-${roleConfig.accentColor}-50 to-${roleConfig.accentColor}-100 border border-${roleConfig.accentColor}-200 rounded-xl p-6 shadow-sm`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-lg font-semibold text-${roleConfig.accentColor}-900 mb-3 flex items-center gap-2`}>
                <User className="w-5 h-5" />
                Account Information
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-${roleConfig.accentColor}-700`}>Role:</span>
                  <span className={`px-3 py-1 bg-${roleConfig.accentColor}-600 text-white rounded-full text-xs font-semibold`}>
                    {roleConfig.roleDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-${roleConfig.accentColor}-700`}>User ID:</span>
                  <span className={`text-${roleConfig.accentColor}-600`}>{currentUser.id}</span>
                </div>
              </div>
            </div>
            
            {/* Permissions Badge */}
            <div className="hidden md:block">
              <p className={`text-xs text-${roleConfig.accentColor}-700 font-medium mb-2`}>Permissions</p>
              <div className="flex flex-wrap gap-1">
                {roleConfig.permissions.map((permission, index) => (
                  <span 
                    key={index}
                    className={`text-xs px-2 py-1 bg-white text-${roleConfig.accentColor}-600 rounded border border-${roleConfig.accentColor}-300`}
                  >
                    {permission.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">
          Update Profile Information
        </h2>
        
        <div className="space-y-6">
          {/* Username Field */}
          {roleConfig.canEditUsername && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                USERNAME
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your username"
              />
            </div>
          )}

          {/* Email Field */}
          {roleConfig.canEditEmail && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>
          )}

          {/* Password Field */}
          {roleConfig.canChangePassword && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4" />
                NEW PASSWORD (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Leave blank to keep current password"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setFormData({
                    username: currentUser.username || '',
                    email: currentUser.email || '',
                    password: '',
                  });
                  showToast('success', 'Form reset to original values');
                }
              }}
              disabled={loading}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Changes
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="max-w-4xl mx-auto mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Security Notice</h3>
            <p className="text-xs text-yellow-700">
              Keep your password secure and don't share it with anyone. If you suspect unauthorized access, 
              change your password immediately and contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
