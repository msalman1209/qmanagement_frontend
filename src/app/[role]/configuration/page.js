'use client';
import { useState } from 'react';

export default function ConfigurationPage() {
  const [preferredVoice, setPreferredVoice] = useState('Male');
  const [preferredLanguage, setPreferredLanguage] = useState('English (US)');

  const handleUpdateSettings = () => {
    console.log('Update settings:', { preferredVoice, preferredLanguage });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Notification Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Preferred Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Preferred Voice
            </label>
            <select
              value={preferredVoice}
              onChange={(e) => setPreferredVoice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Preferred Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            >
              <option value="English (US)">English (US)</option>
              <option value="Arabic">Arabic</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          {/* Update Button */}
          <div className="pt-4">
            <button
              onClick={handleUpdateSettings}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Update Notification Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
