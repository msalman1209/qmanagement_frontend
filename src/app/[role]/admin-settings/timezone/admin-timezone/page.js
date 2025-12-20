'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { FaClock, FaGlobe, FaSave, FaTimes, FaCheck } from 'react-icons/fa';
import { getUser } from '@/utils/sessionStorage';

export default function AdminTimezonePage() {
  const currentUser = useSelector(selectCurrentUser);
  const [adminId, setAdminId] = useState(null);
  
  // ✅ Initialize adminId from Redux or session with proper fallback
  useEffect(() => {
    // Try Redux first
    if (currentUser && currentUser.admin_id) {
      setAdminId(currentUser.admin_id);
      console.log('✅ Using admin_id from Redux:', currentUser.admin_id);
    } else if (currentUser && currentUser.role === 'admin') {
      setAdminId(currentUser.id);
      console.log('✅ Using admin_id from Redux admin user:', currentUser.id);
    } else {
      // Fallback to session storage
      const sessionUser = getUser();
      if (sessionUser && sessionUser.admin_id) {
        setAdminId(sessionUser.admin_id);
        console.log('✅ Using admin_id from session:', sessionUser.admin_id);
      } else if (sessionUser && sessionUser.role === 'admin') {
        setAdminId(sessionUser.id);
        console.log('✅ Using admin_id from session admin user:', sessionUser.id);
      } else {
        console.error('❌ No admin_id found in Redux or session');
      }
    }
  }, [currentUser]);
  
  // Default timezones list (in case API fails)
  const defaultTimezones = [
    { offset: '+05:00', name: 'Pakistan Standard Time (PKT)', region: 'Pakistan' },
    { offset: '+04:00', name: 'Gulf Standard Time (GST)', region: 'UAE, Saudi Arabia' },
    { offset: '+03:00', name: 'East Africa Time (EAT)', region: 'East Africa' },
    { offset: '+02:00', name: 'Central Africa Time (CAT)', region: 'Central Africa' },
    { offset: '+01:00', name: 'West Africa Time (WAT)', region: 'West Africa' },
    { offset: '+00:00', name: 'Coordinated Universal Time (UTC)', region: 'UTC' },
    { offset: '-05:00', name: 'Eastern Standard Time (EST)', region: 'USA East' },
    { offset: '-06:00', name: 'Central Standard Time (CST)', region: 'USA Central' },
    { offset: '-07:00', name: 'Mountain Standard Time (MST)', region: 'USA Mountain' },
    { offset: '-08:00', name: 'Pacific Standard Time (PST)', region: 'USA West' },
  ];

  const [timezones, setTimezones] = useState(defaultTimezones);
  const [currentTimezone, setCurrentTimezone] = useState('+05:00');
  const [selectedTimezone, setSelectedTimezone] = useState('+05:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch available timezones
  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/timezones`);
        if (response.ok) {
          const data = await response.json();
          if (data.timezones && Array.isArray(data.timezones)) {
            setTimezones(data.timezones);
          }
        }
      } catch (error) {
        console.error('Failed to fetch timezones, using defaults:', error);
        setTimezones(defaultTimezones);
      }
    };

    fetchTimezones();
  }, []);

  // Fetch current admin's timezone
  useEffect(() => {
    const fetchCurrentTimezone = async () => {
      try {
        // ✅ Wait for adminId to be set before fetching
        if (!adminId) {
          console.log('⏭️ Skipping fetch - adminId not set yet');
          return;
        }
        
        console.log('🔍 Fetching timezone for admin_id:', adminId);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/admin/timezone/${adminId}`);
        if (response.ok) {
          const data = await response.json();
          const tz = data.timezone || '+05:00';
          setCurrentTimezone(tz);
          setSelectedTimezone(tz);
        } else {
          console.log('API returned non-ok status, using default');
          setCurrentTimezone('+05:00');
          setSelectedTimezone('+05:00');
        }
      } catch (error) {
        console.error('Failed to fetch timezone, using default:', error);
        setCurrentTimezone('+05:00');
        setSelectedTimezone('+05:00');
      } finally {
        setLoading(false);
      }
    };

    if (adminId) {
      fetchCurrentTimezone();
    } else {
      setLoading(false);
    }
  }, [adminId]);

  // Get current time in selected timezone
  const getCurrentTime = (offset) => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const offsetMs = parseInt(offset.split(':')[0]) * 3600000;
    const localDate = new Date(utc + offsetMs);
    
    return localDate.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get timezone name from offset
  const getTimezoneName = (offset) => {
    const timezone = timezones.find(tz => tz.offset === offset);
    return timezone ? timezone.name : 'Unknown';
  };

  // Save timezone
  const handleSave = async () => {
    if (selectedTimezone === currentTimezone) {
      setMessage({ type: 'info', text: 'No changes made' });
      return;
    }

    if (!adminId) {
      setMessage({ type: 'error', text: 'Error: Admin ID not found. Please login again.' });
      return;
    }

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/admin/timezone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId,
          timezone: selectedTimezone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTimezone(selectedTimezone);
        setMessage({ type: 'success', text: '✓ Timezone updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to update timezone'}` });
      }
    } catch (error) {
      console.error('Error updating timezone:', error);
      setMessage({ type: 'error', text: 'Error: Could not reach server. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setSelectedTimezone(currentTimezone);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <FaClock className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Timezone Settings</h1>
              <p className="text-gray-600 mt-1">Set your preferred timezone for all activities</p>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        {loading && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading timezone settings...</span>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.type === 'success' && <FaCheck className="text-lg flex-shrink-0" />}
            {message.type === 'error' && <FaTimes className="text-lg flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Timezone Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Current Timezone</h3>
              <div className="flex items-center gap-3 mb-4">
                <FaGlobe className="text-2xl text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{currentTimezone}</p>
                  <p className="text-sm text-gray-600">{getTimezoneName(currentTimezone)}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mt-6">
                <p className="text-xs text-gray-600 font-semibold mb-2">Current Local Time</p>
                <p className="text-lg font-mono font-bold text-gray-800">
                  {getCurrentTime(currentTimezone)}
                </p>
              </div>
            </div>

            {/* Timezone Selection */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Select New Timezone</h3>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 mb-4"
              >
                {timezones.map((tz) => (
                  <option key={tz.offset} value={tz.offset}>
                    {tz.name} ({tz.offset})
                  </option>
                ))}
              </select>
              <div className="bg-white rounded-lg p-4 mt-6">
                <p className="text-xs text-gray-600 font-semibold mb-2">Preview in Selected Timezone</p>
                <p className="text-lg font-mono font-bold text-gray-800">
                  {getCurrentTime(selectedTimezone)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
              disabled={saving}
            >
              <FaTimes /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedTimezone === currentTimezone}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Timezone Reference */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaClock className="text-green-500" />
            Available Timezones Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timezones.map((tz) => (
              <div
                key={tz.offset}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedTimezone === tz.offset
                    ? 'bg-green-50 border-green-400'
                    : currentTimezone === tz.offset
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedTimezone(tz.offset)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{tz.name}</p>
                    <p className="text-sm text-gray-600">{tz.offset}</p>
                  </div>
                  {currentTimezone === tz.offset && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded font-semibold">Current</span>
                  )}
                  {selectedTimezone === tz.offset && selectedTimezone !== currentTimezone && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-semibold">Selected</span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-600 mt-2">
                  {getCurrentTime(tz.offset)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How This Works</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Your timezone setting will be saved to your profile</li>
            <li>✓ All your activities (tickets, calls, updates) will be recorded in your local timezone</li>
            <li>✓ The system will automatically use your timezone for all timestamps</li>
            <li>✓ You can change your timezone anytime from this page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
