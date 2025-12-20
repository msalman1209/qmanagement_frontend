'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosInstance';
import { getToken, getUser } from '@/utils/sessionStorage';

export default function ConfigurationPage({ adminId: propAdminId }) {
  // ✅ Get adminId from prop OR from logged-in user's session
  const [adminId, setAdminId] = useState(null);
  
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
  
  const [selectedLanguages, setSelectedLanguages] = useState(['en']); // Max 2 languages
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [testText, setTestText] = useState('Ticket number P-101 please come to counter 5');
  
  // ChatterBox AI Voice states
  const [chatterboxVoices, setChatterboxVoices] = useState([]);
  const [selectedChatterboxVoice, setSelectedChatterboxVoice] = useState('male');  // ✅ Default to 'male' instead of empty string
  const [chatterboxServiceStatus, setChatterboxServiceStatus] = useState('unknown');
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    // Load settings from database first, then fallback to localStorage
    loadSettings();
    
    // Check ChatterBox service status and load voices
    checkChatterboxService();
  }, [adminId]);
  
  const loadSettings = async () => {
    try {
      // ✅ Always require adminId - user must belong to an admin
      if (!adminId) {
        console.error('❌ No adminId provided - cannot load settings');
        return;
      }
      
      // Try to load from database with adminId
      const url = `${process.env.NEXT_PUBLIC_API_URL}/voices/settings?adminId=${adminId}`;
        
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.settings) {
        const settings = response.data.settings;
        const languages = settings.languages ? JSON.parse(settings.languages) : ['en'];
        setSelectedLanguages(languages);
        setSpeechRate(settings.speech_rate || 0.9);
        setSpeechPitch(settings.speech_pitch || 1.0);
        // Load voice_type directly from database
        setSelectedChatterboxVoice(settings.voice_type || 'male');
        console.log('📥 Loaded voice_type from database:', settings.voice_type);
        
        // Also save to localStorage for offline access
        localStorage.setItem('tts_settings', JSON.stringify({
          selectedLanguages: languages,
          speechRate: settings.speech_rate,
          speechPitch: settings.speech_pitch,
          selectedChatterboxVoice: settings.voice_type || 'male',
          useAI: true
        }));
        
        console.log('✅ Settings loaded from database:', settings);
      }
    } catch (error) {
      console.warn('⚠️ Could not load from database, using localStorage:', error.message);
      // Fallback to localStorage
      const saved = localStorage.getItem('tts_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSelectedLanguages(settings.selectedLanguages || ['en']);
        setSpeechRate(settings.speechRate || 0.9);
        setSpeechPitch(settings.speechPitch || 1.0);
        // Load voice directly from localStorage
        setSelectedChatterboxVoice(settings.selectedChatterboxVoice || 'male');
        console.log('📥 Loaded voice_type from localStorage:', settings.selectedChatterboxVoice);
      }
    }
  };
  
  const checkChatterboxService = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/voices/health`);
      if (response.data.success) {
        setChatterboxServiceStatus('online');
        loadChatterboxVoices();
      } else {
        setChatterboxServiceStatus('offline');
      }
    } catch (error) {
      setChatterboxServiceStatus('offline');
    }
  };
  
  const loadChatterboxVoices = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/voices/list`);
      console.log('✅ Loaded voices from Python service:', response.data);
      if (response.data.success && response.data.data) {
        const voicesData = response.data.data;
        
        // Filter to only use voices with clean IDs (male, female, child)
        const cleanVoices = voicesData.filter(voice => 
          ['male', 'female', 'child'].includes(voice.id)
        );
        
        setChatterboxVoices(cleanVoices);
        console.log(`🎤 ${cleanVoices.length} voice(s) loaded (filtered for clean IDs only)`);
      }
    } catch (error) {
      console.error('❌ Failed to load ChatterBox voices:', error);
      // Set fallback voices if service is down
      setChatterboxVoices([
        { id: 'male', name: '👨 Male Voice', type: 'male' },
        { id: 'female', name: '👩 Female Voice', type: 'female' },
        { id: 'child', name: '👶 Child Voice', type: 'child' }
      ]);
    }
  };
  
  // Handle language selection (max 2)
  const handleLanguageToggle = (langCode) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langCode)) {
        // Remove if already selected
        return prev.filter(l => l !== langCode);
      } else if (prev.length < 2) {
        // Add if less than 2 selected
        return [...prev, langCode];
      } else {
        // Replace first language if 2 already selected
        return [prev[1], langCode];
      }
    });
  };
  
  // Translate text to different languages
  const translateText = (text, langCode) => {
    const translations = {
      'en': {
        ticket: 'Ticket number',
        counter: 'Please go to counter number',
        number: (num) => num
      },
      'ar': {
        ticket: 'تذكرة رقم',
        counter: 'الرجاء الذهاب لكونتر رقم',
        number: (num) => {
          const arabicNumbers = {'0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩'};
          return num.toString().split('').map(d => arabicNumbers[d] || d).join('');
        }
      },
      'ar-ae': { // Dubai Arabic
        ticket: 'التذكره رقم بي',
        counter: 'الذهاب إلى الكونتر رقم',
        number: (num) => {
          // Dubai Arabic number words
          const arabicNumerals = {
            '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
            '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
          };
          // Convert to Arabic numerals (٠-٩)
          return num.toString().split('').map(d => arabicNumerals[d] || d).join('');
        }
      },
      'ur': {
        ticket: 'ٹکٹ نمبر',
        counter: 'براہ کرم کاؤنٹر نمبر پر تشریف لے جائیں',
        number: (num) => num
      },
      'hi': {
        ticket: 'टिकट नंबर',
        counter: 'कृपया काउंटर नंबर पर जाएं',
        number: (num) => num
      },
      'es': {
        ticket: 'Número de ticket',
        counter: 'Por favor vaya al mostrador número',
        number: (num) => num
      }
    };
    
    // Parse ticket and counter from text
    const ticketMatch = text.match(/P-(\d+)|number\s+(\d+)/i);
    const counterMatch = text.match(/counter\s+(\d+)/i);
    
    const ticketNum = ticketMatch ? (ticketMatch[1] || ticketMatch[2]) : '101';
    const counterNum = counterMatch ? counterMatch[1] : '5';
    
    const lang = translations[langCode] || translations['en'];
    
    if (langCode === 'ar' || langCode === 'ar-ae') {
      // Arabic is right-to-left
      if (langCode === 'ar-ae') {
        // Dubai format: "التذكره رقم بي -١٠١ الذهاب إلى الكونتر رقم ٥"
        return `${lang.ticket} -${lang.number(ticketNum)} ${lang.counter} ${lang.number(counterNum)}`;
      }
      return `${lang.ticket}: ${lang.number(ticketNum)}\n${lang.counter} ${lang.number(counterNum)}`;
    }
    
    return `${lang.ticket} ${lang.number(ticketNum)}\n${lang.counter} ${lang.number(counterNum)}`;
  };
  
  const handleVoiceUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('voice', file);
      formData.append('name', file.name);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/voices/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
        }
      });
      
      if (response.data.success) {
        alert('Voice sample uploaded successfully!');
        loadChatterboxVoices();
      }
    } catch (error) {
      alert('Failed to upload voice sample: ' + error.message);
    } finally {
      setUploadingVoice(false);
    }
  };

  const handleUpdateSettings = async () => {
    // ✅ Validate adminId before saving
    if (!adminId) {
      alert('❌ Error: No admin ID found. Cannot save settings.');
      return;
    }
    
    const settings = {
      selectedLanguages,
      speechRate,
      speechPitch,
      selectedChatterboxVoice,
      useAI: true // Always use AI voices
    };
    
    try {
      // Save to database with admin_id (always required)
      const payload = {
        voice_type: selectedChatterboxVoice,
        languages: JSON.stringify(selectedLanguages), // Save as JSON array
        speech_rate: speechRate,
        speech_pitch: speechPitch,
        admin_id: adminId // ✅ Always include adminId
      };
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/voices/settings`, payload, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        // Also save to localStorage for offline access
        localStorage.setItem('tts_settings', JSON.stringify(settings));
        console.log('✅ Settings saved to database and localStorage');
        
        // 🔔 Broadcast settings update to ticket_info page
        try {
          const voiceSettingsChannel = new BroadcastChannel('voice-settings-update');
          voiceSettingsChannel.postMessage({ 
            updated: true, 
            voice_type: selectedChatterboxVoice,
            languages: selectedLanguages,
            timestamp: Date.now()
          });
          voiceSettingsChannel.close();
          console.log('📢 Broadcasted voice settings update to ticket_info page');
        } catch (broadcastError) {
          console.warn('⚠️ Could not broadcast settings update:', broadcastError);
        }
        
        alert('✅ Settings saved successfully to database!');
      } else {
        throw new Error(response.data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      // Fallback: save to localStorage only
      localStorage.setItem('tts_settings', JSON.stringify(settings));
      alert('⚠️ Settings saved to browser only (database error: ' + error.message + ')');
    }
  };

  const handleTestVoice = async () => {
    if (chatterboxServiceStatus !== 'online') {
      alert('⚠️ ChatterBox AI service is offline! Please start the Python service.');
      return;
    }

    console.log('🎯 Starting voice test with:', {
      selectedLanguages,
      testText,
      speechRate,
      speechPitch,
      selectedChatterboxVoice
    });
    
    console.log('🔍 DEBUG - Current state selectedChatterboxVoice:', selectedChatterboxVoice);
    console.log('🔍 DEBUG - Type:', typeof selectedChatterboxVoice);
    console.log('🔍 DEBUG - Is empty?', !selectedChatterboxVoice);
    console.log('🔍 DEBUG - Is default?', selectedChatterboxVoice === 'default');

    if (selectedLanguages.length === 0) {
      alert('⚠️ Please select at least one language!');
      return;
    }

    setSynthesizing(true);
    try {
      // Test all selected languages sequentially
      for (let i = 0; i < selectedLanguages.length; i++) {
        const lang = selectedLanguages[i];
        const translatedText = translateText(testText, lang);
        
        console.log(`\n📢 Testing Box ${i + 1}/${selectedLanguages.length}:`);
        console.log(`   Language: ${lang}`);
        console.log(`   Text: ${translatedText}`);
        console.log(`   Voice: ${selectedChatterboxVoice}`);
        console.log(`   Rate: ${speechRate}, Pitch: ${speechPitch}`);

        console.log(`🌐 Making API request for Box ${i + 1}...`);
        console.log(`🎤 SENDING TO API - Voice Type: ${selectedChatterboxVoice}`);
        
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/voices/synthesize`, {
          text: translatedText,
          language: lang,
          speed: speechRate,
          pitch: speechPitch,
          voice_type: selectedChatterboxVoice || 'male'  // Send selected voice directly
        }).catch(err => {
          console.error(`❌ Box ${i + 1} API request failed:`, err);
          throw err;
        });
        
        console.log(`✅ Box ${i + 1} synthesis response:`, response.data);
        
        if (response.data.success && response.data.audioUrl) {
          console.log(`🔊 Box ${i + 1} - Playing audio from:`, response.data.audioUrl);
          const audio = new Audio(response.data.audioUrl);
          audio.volume = 1.0;
          
          // Wait for audio to finish before next language
          await new Promise((resolve, reject) => {
            audio.onplay = () => console.log(`▶️ Box ${i + 1} (${lang}) - Playback started`);
            audio.onended = () => {
              console.log(`✅ Box ${i + 1} (${lang}) - Playback completed`);
              resolve();
            };
            audio.onerror = (e) => {
              console.error(`❌ Box ${i + 1} audio error:`, e);
              reject(e);
            };
            
            // Start playback
            audio.play().catch(err => {
              console.error(`❌ Box ${i + 1} play() failed:`, err);
              reject(err);
            });
          });
          
          // Pause between languages (200ms for smooth transition)
          if (i < selectedLanguages.length - 1) {
            console.log(`⏸️ Pausing 200ms before Box ${i + 2}...`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          console.error(`❌ Box ${i + 1} synthesis failed:`, response.data);
          throw new Error(response.data.message || 'Synthesis failed');
        }
      }
      
      console.log('🎉 All voice tests completed successfully!');
      alert(`✅ Voice test successful!\n\nTested ${selectedLanguages.length} language(s):\n${selectedLanguages.map((l, i) => `${i + 1}. Box ${i + 1}: ${l}`).join('\n')}`);
    } catch (error) {
      console.error('❌ Voice synthesis error:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Voice test failed!\n\nError: ${errorMsg}\n\nCheck browser console for details.`);
    } finally {
      setSynthesizing(false);
      console.log('🏁 Voice test ended');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Notification Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="space-y-6">
          
          {/* AI Voice Service Status */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[22px] font-bold flex items-center gap-2">
                  🎙️ ChatterBox Tech Solutionor Custom Voice System
                </h2>
                <p className="text-white/90 mt-1">
                  Advanced Tech Solutionor-powered text-to-speech 
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                  chatterboxServiceStatus === 'online' 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
                  {chatterboxServiceStatus === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </div>
          
          {/* ChatterBox AI Voice Section */}
          {chatterboxServiceStatus === 'offline' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ <strong>ChatterBox service is offline.</strong> Please start the Python service:
              </p>
              <code className="block bg-red-100 text-red-900 p-2 rounded mt-2 text-xs">
                cd python-tts-service && python app.py
              </code>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 space-y-6">
            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
              🎤 AI Voice Settings
            </h3>
            
            {/* AI Voice Configuration */}
            <div className="space-y-4">
              {/* Voice Type Selection - Dynamic from Python Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Type (Dynamically Loaded)
                </label>
                <select
                  value={selectedChatterboxVoice}
                  onChange={(e) => {
                    console.log('🔄 Dropdown changed to:', e.target.value);
                    setSelectedChatterboxVoice(e.target.value);
                  }}
                  disabled={chatterboxServiceStatus === 'offline'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
                >
                  {chatterboxVoices.length > 0 ? (
                    chatterboxVoices.map(voice => {
                      console.log('🎤 Voice option:', { id: voice.id, name: voice.name, type: voice.type });
                      return (
                        <option key={voice.id || voice.name} value={voice.id}>
                          {voice.name}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="male">👨 Male Voice</option>
                      <option value="female">👩 Female Voice</option>
                      <option value="child">👶 Child Voice</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {chatterboxVoices.length > 0 
                    ? `${chatterboxVoices.length} voice(s) loaded from Python service` 
                    : 'Loading voices from Python service...'}
                </p>
              </div>
            </div>

          {/* Preferred Languages - Multi Select (Max 2) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Languages (Select up to 2)
            </label>
            <p className="text-xs text-gray-500 mb-3">Select maximum 2 languages for announcements</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { code: 'en', flag: '🇬🇧', name: 'English' },
                { code: 'ar-ae', flag: '🇦🇪', name: 'Dubai Arabic' },
                { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
                { code: 'ur', flag: '🇵🇰', name: 'Urdu (اردو)' },
                { code: 'hi', flag: '🇮🇳', name: 'Hindi' },
                { code: 'es', flag: '🇪🇸', name: 'Spanish' }
              ].map(lang => (
                <label
                  key={lang.code}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedLanguages.includes(lang.code)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${
                    !selectedLanguages.includes(lang.code) && selectedLanguages.length >= 2
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    disabled={!selectedLanguages.includes(lang.code) && selectedLanguages.length >= 2}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Preview Boxes for Selected Languages */}
          {selectedLanguages.length > 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Preview - Translation & Voice
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLanguages.map((lang, index) => {
                  const langNames = {
                    'en': 'English 🇬🇧',
                    'ar': 'Arabic 🇸🇦',
                    'ar-ae': 'Dubai Arabic 🇦🇪',
                    'ur': 'Urdu 🇵🇰',
                    'hi': 'Hindi 🇮🇳',
                    'es': 'Spanish 🇪🇸'
                  };
                  const isRTL = lang === 'ar' || lang === 'ar-ae' || lang === 'ur';
                  return (
                    <div key={lang} className="border-2 border-green-300 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-green-700">{langNames[lang]}</h4>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Box {index + 1}</span>
                      </div>
                      <div className={`bg-white border border-gray-300 rounded p-3 min-h-[80px] ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}>
                        <p className={`text-sm text-gray-800 whitespace-pre-line ${
                          isRTL ? 'font-arabic' : ''
                        }`} style={isRTL ? { direction: 'rtl', fontFamily: 'Arial, sans-serif' } : {}}>
                          {translateText(testText, lang)}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-semibold">Voice:</span> {selectedChatterboxVoice || 'Default'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              disabled={synthesizing || chatterboxServiceStatus === 'offline'}
              className={`flex-1 px-8 py-3 rounded-lg font-medium transition-colors ${
                synthesizing || chatterboxServiceStatus === 'offline'
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {synthesizing ? '⏳ Generating...' : '🔊 Test AI Voice'}
            </button>
            <button
              onClick={handleUpdateSettings}
              className="flex-1 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              💾 Save Settings
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>ℹ️ AI Voice Information:</strong> ChatterBox uses advanced AI models for natural text-to-speech. 
              Upload voice samples to clone any voice! Settings are automatically saved and applied to all announcements.
            </p>
          </div>
          </div> {/* Close AI Voice Settings div */}
        </div>
      </div>
    </div>
  );
}
