'use client';
import { useState } from 'react';

export default function UserDashboardBtnsPage() {
  const [showNextButton, setShowNextButton] = useState(true);
  const [showTransferButton, setShowTransferButton] = useState(true);

  const handleUpdateSettings = () => {
    console.log('Update button settings:', { showNextButton, showTransferButton });
  };

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

          {/* Update Button */}
          <div className="pt-4">
            <button
              onClick={handleUpdateSettings}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Update Button Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
