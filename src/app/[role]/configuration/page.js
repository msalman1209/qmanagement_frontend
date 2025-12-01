'use client';
import { useState, useEffect } from 'react';

export default function ConfigurationPage() {
  const [preferredVoice, setPreferredVoice] = useState('Male');
  const [preferredLanguage, setPreferredLanguage] = useState('English (US)');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [testText, setTestText] = useState('Ticket number 101 please come to counter 5');

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('tts_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setPreferredVoice(settings.preferredVoice || 'Male');
      setPreferredLanguage(settings.preferredLanguage || 'English (US)');
      setSelectedVoice(settings.selectedVoice || '');
      setSpeechRate(settings.speechRate || 0.9);
      setSpeechPitch(settings.speechPitch || 1.0);
    }

    // Load available voices
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleUpdateSettings = () => {
    const settings = {
      preferredVoice,
      preferredLanguage,
      selectedVoice,
      speechRate,
      speechPitch
    };
    
    localStorage.setItem('tts_settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const handleTestVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(testText);
      
      if (selectedVoice) {
        const voice = availableVoices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Notification Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Select Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            >
              <option value="">Default Voice</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select from available system voices (Free - uses browser's built-in TTS)
            </p>
          </div>

          {/* Preferred Voice Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Preferred Voice Type
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
              <option value="Urdu">Urdu</option>
            </select>
          </div>

          {/* Speech Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Speech Rate: {speechRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Speech Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Speech Pitch: {speechPitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (0.5)</span>
              <span>Normal (1.0)</span>
              <span>High (2.0)</span>
            </div>
          </div>

          {/* Test Text */}
          <div>
            <label className="block text-sm font-medium text-gray-600 uppercase mb-2">
              Test Text
            </label>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test voice"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              onClick={handleTestVoice}
              className="flex-1 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              🔊 Test Voice
            </button>
            <button
              onClick={handleUpdateSettings}
              className="flex-1 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              💾 Save Settings
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Info:</strong> This uses the free Web Speech API built into your browser. 
              No external API or costs required! Settings are saved locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
