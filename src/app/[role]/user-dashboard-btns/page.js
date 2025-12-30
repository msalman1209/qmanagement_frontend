'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosInstance';
import { getToken, getSessionData, getUser } from '@/utils/sessionStorage';



export default function UserDashboardBtnsPage({ adminId: propAdminId }) {
  // ✅ Get adminId from prop OR from logged-in user's session
  const [adminId, setAdminId] = useState(null);
  const [showNextButton, setShowNextButton] = useState(true);
  const [showTransferButton, setShowTransferButton] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch admin_id from prop or session
  useEffect(() => {
    // If adminId not provided as prop, get from logged-in user
    if (propAdminId) {
      setAdminId(propAdminId);
      console.log('✅ Using admin_id from prop:', propAdminId);
    } else {
      const user = getUser();
      if (user && user.admin_id) {
        setAdminId(user.admin_id);
        console.log('✅ Using admin_id from logged-in user:', user.admin_id);
      } else {
        console.error('❌ No admin_id found in user session');
      }
    }
  }, [propAdminId]);

  // Fetch current settings on component mount
  useEffect(() => {
    // Only load settings when adminId is available
    if (adminId) {
      fetchSettings(adminId);
    }
  }, [adminId]);

  const fetchSettings = async (userId) => {
    try {
      // ✅ Always require adminId - user must belong to an admin
      if (!userId) {
        console.warn('⚠️ Waiting for adminId to load settings...');
        return;
      }
      
      console.log('📥 Loading button settings for admin_id:', userId);
      
      const token = getToken();
      const response = await axios.get(`/button-settings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowNextButton(response.data.settings.showNextButton);
        setShowTransferButton(response.data.settings.showTransferButton);
        console.log('✅ Button settings loaded from database:', response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // If no settings found, use defaults
      if (error.response?.status === 404) {
        setShowNextButton(true);
        setShowTransferButton(true);
        console.log('ℹ️ No settings found, using defaults');
      } else {
        setMessage('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    // ✅ Validate adminId before saving
    if (!adminId) {
      setMessage('❌ Error: No admin ID found. Cannot save settings.');
      console.error('❌ No admin_id found. Cannot save settings.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const token = getToken();
      const response = await axios.put(
        `/button-settings/${adminId}`,
        {
          showNextButton,
          showTransferButton
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage('✅ Button settings updated successfully!');
        console.log('✅ Button settings saved to database for admin_id:', adminId);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('❌ Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <p className="text-yellow-800 font-medium">Loading button settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Button Settings</h1>
      
      {/* Loading state while adminId is being fetched */}
      {!adminId && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 max-w-2xl mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <p className="text-yellow-800 font-medium">Loading admin configuration...</p>
          </div>
        </div>
      )}
      
      {/* Show settings only when adminId is available */}
      {adminId && (
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Show "NEXT" Button */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="show-next"
              checked={showNextButton}
              onChange={(e) => setShowNextButton(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="show-next" className="text-sm font-medium text-gray-600 uppercase">
              Show "Next" Button
            </label>
          </div>

          {/* Show "TRANSFER" Button */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="show-transfer"
              checked={showTransferButton}
              onChange={(e) => setShowTransferButton(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="show-transfer" className="text-sm font-medium text-gray-600 uppercase">
              Show "Transfer" Button
            </label>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Update Button */}
          <div className="pt-4">
            <button
              onClick={handleUpdateSettings}
              disabled={saving}
              className={`px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Update Button Settings'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
