'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { updateOwnProfile } from '@/store/thunks';
import { updateUser } from '@/store/slices/authSlice';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Load current user data
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
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

  const handleUpdateProfile = async () => {
    if (!currentUser) {
      showToast('error', 'User not found');
      return;
    }

    if (!username.trim() || !email.trim()) {
      showToast('error', 'Username and email are required');
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
        username: username.trim(),
        email: email.trim(),
      };

      // Only include password if it's provided
      if (password.trim()) {
        updateData.password = password;
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
      setPassword(''); // Clear password field after successful update
    } catch (error) {
      showToast('error', error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
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
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Profile</h1>
      
      {/* User Info Display */}
      {currentUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-blue-800 mb-2">Current User Information</h2>
          <div className="text-sm text-blue-700">
            <p><span className="font-medium">Role:</span> {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
            <p><span className="font-medium">User ID:</span> {currentUser.id}</p>
          </div>
        </div>
      )}

      {/* Message Display - Removed as we're using toast now */}
      
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Password (Leave blank to keep current password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Update Button */}
          <div className="pt-4">
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
