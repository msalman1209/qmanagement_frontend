'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosInstance';
import { getToken } from '@/utils/sessionStorage';



export default function UserDashboardBtnsPage() {
  const [showNextButton, setShowNextButton] = useState(true);
  const [showTransferButton, setShowTransferButton] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getToken();
      const response = await axios.get('/button-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowNextButton(response.data.settings.showNextButton);
        setShowTransferButton(response.data.settings.showTransferButton);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = getToken();
      const response = await axios.put(
        '/button-settings',
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
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Button Settings</h1>
      
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
    </div>
  );
}
