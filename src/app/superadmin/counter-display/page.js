'use client';
import { useState } from 'react';

export default function CounterDisplayPage() {
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [tickerContent, setTickerContent] = useState('Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C');

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedVideo(file);
      console.log('Video uploaded:', file.name);
    }
  };

  const handleUpdateContent = () => {
    console.log('Update content:', { uploadedVideo, tickerContent });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Counter Display Management</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Upload Video */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Upload Video
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            />
          </div>

          {/* Ticker Content */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Ticker Content
            </label>
            <input
              type="text"
              value={tickerContent}
              onChange={(e) => setTickerContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            />
          </div>

          {/* Update Button */}
          <div className="pt-4">
            <button
              onClick={handleUpdateContent}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Update Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
