'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import axios from '@/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/Components/ProtectedRoute';
import { getToken, getUser } from '@/utils/sessionStorage';

function TicketInfoContent() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calledTicket, setCalledTicket] = useState('');
  const [calledTickets, setCalledTickets] = useState([]);
  const [currentCounter, setCurrentCounter] = useState('');
  const [lastAnnouncedTime, setLastAnnouncedTime] = useState(null);
  const [lastVoiceTime, setLastVoiceTime] = useState(null);
  const [aiVoiceReady, setAiVoiceReady] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false); // Prevent overlapping announcements
  const [announcementQueue, setAnnouncementQueue] = useState([]); // Queue for pending tickets
  // Separate state for displayed ticket (only updates after announcement completes)
  const [displayedTicket, setDisplayedTicket] = useState('');
  const [displayedCounter, setDisplayedCounter] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false); // Auto-enabled in background
  const [audioEnabled, setAudioEnabled] = useState(false); // Track user interaction for audio
  
  // Counter Display Config from database
  const [leftLogoUrl, setLeftLogoUrl] = useState('');
  const [rightLogoUrl, setRightLogoUrl] = useState('');
  const [contentType, setContentType] = useState('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [sliderTimer, setSliderTimer] = useState(5);
  const [tickerContent, setTickerContent] = useState('Welcome to Dubai Economic Department Services');
  
  // Remove hardcoded slides - images don't exist in production
  // const slides = ['/assets/img/33.png', '/assets/img/22.png', '/assets/img/11.png'];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const apiUrlWs = process.env.NEXT_PUBLIC_API_URL_WS || 'http://localhost:5000';

  // Session validation - check every 10 seconds
  useEffect(() => {
    const validateSessionStatus = async () => {
      const token = getToken();
      if (!token) {
        // Don't redirect on missing token - auth guard handles this
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/sessions/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Only logout on 401 Unauthorized (session terminated by admin)
        if (response.status === 401) {
          const data = await response.json().catch(() => ({}));
          console.log('❌ Session terminated by administrator');
          alert('Your session has been terminated by the administrator. You will be redirected to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          router.push('/login');
          return;
        }

        // For other errors (500, network issues), just log but don't logout
        if (!response.ok) {
          console.warn('⚠️ Session validation failed (HTTP ' + response.status + ') - will retry');
          return;
        }

        const data = await response.json();

        // Check if session is marked as invalid
        if (data.valid === false) {
          console.log('❌ Session invalidated by administrator');
          alert('Your session has been terminated by the administrator. You will be redirected to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          router.push('/login');
        } else {
          console.log('✅ Session valid');
        }
      } catch (error) {
        // Network error - don't logout, just log and retry later
        console.warn('⚠️ Session validation network error:', error.message, '- will retry');
      }
    };

    // Check after 2 seconds (page load time), then every 10 seconds
    const initialTimeout = setTimeout(validateSessionStatus, 2000);
    const interval = setInterval(validateSessionStatus, 10000);

    // Also check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible - checking session');
        validateSessionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) {
      console.log('🔐 No authentication found, redirecting to ticket-info-login');
      router.push('/ticket-info-login');
      return;
    }

    if (user.role !== 'ticket_info') {
      console.log('❌ User role is not ticket_info, redirecting to ticket-info-login');
      router.push('/ticket-info-login');
      return;
    }

    console.log('✅ Ticket info user authenticated:', user.username);
  }, [router]);

  // Fetch called tickets and update display
  const fetchCalledTickets = async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      console.warn('⚠️ No token or user found - cannot fetch tickets');
      return;
    }
    
    try {
      console.log('🌐 API Call: GET', `${apiUrl}/user/called-tickets`);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${apiUrl}/user/called-tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Backend tickets response:', data);
        
        if (data.success && data.tickets && data.tickets.length > 0) {
          console.log('🔍 ALL TICKETS from backend (before filter):', data.tickets.map(t => ({
            ticket: t.ticket_number,
            status: t.status,
            counter: t.counter_no
          })));
          
          // Filter: ONLY show tickets with 'called' status AND valid counter_no
          // Exclude: NULL counters, unattended, solved, not_solved
          const calledOnlyTickets = data.tickets.filter(ticket => 
            ticket.status && 
            ticket.status.toLowerCase() === 'called' &&
            ticket.counter_no !== null &&
            ticket.counter_no !== undefined &&
            ticket.counter_no !== ''
          );
          
          console.log('✅ FILTERED tickets (status=called + valid counter):', calledOnlyTickets.map(t => ({
            ticket: t.ticket_number,
            status: t.status,
            counter: t.counter_no
          })));
          console.log(`📊 Total: ${data.tickets.length} tickets, Filtered: ${calledOnlyTickets.length} valid tickets`);
          
          setCalledTickets(calledOnlyTickets);
          
          // Get the latest ticket (first one - sorted by called_at DESC)
          if (calledOnlyTickets.length > 0) {
            const latestTicket = calledOnlyTickets[0];
            const latestTimestamp = new Date(latestTicket.called_at).getTime();
          
            console.log('🎫 Latest ticket from backend:', {
              ticket: latestTicket.ticket_number,
              counter: latestTicket.counter_no,
              called_at: latestTicket.called_at,
              status: latestTicket.status,
              timestamp: latestTimestamp
            });
            
            // Check if this is a NEW ticket (different timestamp or ticket number)
            if (!lastAnnouncedTime || latestTimestamp > lastAnnouncedTime) {
              console.log('🆕 NEW TICKET DETECTED!');
              
              // If announcement is in progress, add to queue
              if (isAnnouncing) {
                console.log('⏳ Announcement in progress, adding to queue');
                setAnnouncementQueue(prev => {
                  // Check if ticket already in queue
                  const exists = prev.some(t => t.ticket === latestTicket.ticket_number);
                  if (!exists) {
                    return [...prev, {
                      ticket: latestTicket.ticket_number,
                      counter: latestTicket.counter_no || 'N/A',
                      timestamp: latestTimestamp
                    }];
                  }
                  return prev;
                });
              } else {
                // Update display immediately if no announcement in progress
                console.log('🔄 Updating display and triggering voice');
                setCalledTicket(latestTicket.ticket_number);
                setCurrentCounter(latestTicket.counter_no || 'N/A');
                setLastAnnouncedTime(latestTimestamp);
              }
            } else {
              console.log('ℹ️ Same ticket, no update needed');
            }
          } else {
            console.log('ℹ️ No called tickets available');
          }
        } else {
          console.warn('⚠️ Backend response success=false or no tickets array');
        }
      } else {
        console.error('❌ API call failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching called tickets:', error);
      console.error('❌ Error details:', error.message, error.stack);
    }
  };

  // Fetch counter display configuration from database
  const fetchDisplayConfig = async () => {
    try {
      const token = getToken();
      const user = getUser();
      
      if (!token) {
        console.warn('⚠️ No token found - cannot fetch display config');
        return;
      }

      // Get admin_id from current user
      const adminId = user?.admin_id;
      if (!adminId) {
        console.error('❌ No admin_id found for ticket_info user:', user);
        return;
      }

      console.log('📡 Fetching display config for admin_id:', adminId);

      // Add admin_id as query parameter
      const response = await axios.get(`${apiUrl}/counter-display/config?adminId=${adminId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const { config, images } = response.data;
        
        console.log('📦 Display config response:', { config, imagesCount: images?.length });
        
        if (config) {
          setLeftLogoUrl(config.left_logo_url || '');
          setRightLogoUrl(config.right_logo_url || '');
          setContentType(config.content_type || 'video');
          setVideoUrl(config.video_url || '');
          setSliderTimer(config.slider_timer || 5);
          setTickerContent(config.ticker_content || 'Welcome to Dubai Economic Department Services');
          
          console.log('✅ Display config loaded:', {
            leftLogo: config.left_logo_url ? 'Yes' : 'No',
            rightLogo: config.right_logo_url ? 'Yes' : 'No',
            contentType: config.content_type,
            videoUrl: config.video_url ? 'Yes' : 'No'
          });
        }
        
        // Load selected images for slider
        if (images && images.length > 0) {
          const selectedImages = images.filter(img => img.is_selected === 1);
          const imageUrls = selectedImages.map(img => `${process.env.NEXT_PUBLIC_API_URL_WS}${img.image_url}`);
          setSliderImages(imageUrls);
          console.log('✅ Slider images loaded:', selectedImages.length, imageUrls);
        }
      } else {
        console.error('❌ Display config fetch failed:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching display config:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
    }
  };

  // Auto-slide functionality for images
  useEffect(() => {
    if (contentType === 'images' && sliderImages.length > 0) {
      const slideInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, sliderTimer * 1000);
      return () => clearInterval(slideInterval);
    }
  }, [contentType, sliderImages, sliderTimer]);

  // Fetch called tickets on mount and set up polling
  useEffect(() => {
    console.log('🔄 Starting ticket polling...');
    console.log('🔧 API URL:', apiUrl);
    console.log('🔧 Full endpoint:', `${apiUrl}/user/called-tickets`);
    
    // Fetch display config on mount
    fetchDisplayConfig();
    
    fetchCalledTickets();
    const pollInterval = setInterval(() => {
      console.log('🔃 Polling backend for new tickets...');
      fetchCalledTickets();
    }, 2000); // Check every 2 seconds
    return () => {
      console.log('⏹️ Stopping ticket polling');
      clearInterval(pollInterval);
    };
  }, []); // Empty dependencies - poll should run continuously without restart

  
  // Setup BroadcastChannel for cross-tab communication
  useEffect(() => {
    console.log('🚀 Setting up BroadcastChannel for ticket_info');
    
    // Create broadcast channel for ticket calls
    const channel = new BroadcastChannel('ticket-calls');
    setBroadcastChannel(channel);
    
    // Also listen for voice settings updates
    const voiceSettingsChannel = new BroadcastChannel('voice-settings-update');
    
    voiceSettingsChannel.onmessage = (event) => {
      console.log('🔔 Voice settings updated by admin:', event.data);
      if (event.data && event.data.updated) {
        console.log('🔄 Admin changed voice settings - will use NEW settings on next announcement');
        // Clear localStorage cache
        localStorage.removeItem('tts_settings');
        // Settings will be fetched fresh from database on next announcement
      }
    };
    
    // Listen for messages from dashboard
    channel.onmessage = (event) => {
      console.log('🔔 BroadcastChannel received:', event.data);
      
      if (event.data && event.data.ticket) {
        const { ticket, counter, timestamp } = event.data;
        
        console.log('🔄 Updating display with:', { ticket, counter, timestamp });
        
        // Check if announcement is in progress
        if (isAnnouncing) {
          console.log('⏳ Announcement in progress, adding BroadcastChannel ticket to queue');
          setAnnouncementQueue(prev => {
            const exists = prev.some(t => t.ticket === ticket);
            if (!exists) {
              return [...prev, {
                ticket: ticket,
                counter: counter || 'N/A',
                timestamp: timestamp
              }];
            }
            return prev;
          });
        } else {
          // Update display immediately if no announcement in progress
          setCalledTicket(ticket);
          setCurrentCounter(counter || 'N/A');
          setLastAnnouncedTime(timestamp);
          
          console.log('✅ State updated successfully - announcement will trigger automatically');
        }
        
        // Refresh table from backend
        fetchCalledTickets();
      }
    };
    
    // Also check localStorage on mount for existing data
    const ticketData = localStorage.getItem('latest_ticket_call');
    if (ticketData) {
      try {
        const data = JSON.parse(ticketData);
        console.log('📦 Found existing ticket in localStorage:', data);
        if (data.ticket) {
          setCalledTicket(data.ticket);
          setCurrentCounter(data.counter || 'N/A');
          setLastAnnouncedTime(data.timestamp);
        }
      } catch (e) {
        console.error('❌ Error parsing localStorage data:', e);
      }
    }
    
    return () => {
      console.log('🧹 Closing BroadcastChannels');
      channel.close();
      voiceSettingsChannel.close();
    };
  }, []);

  // Check ChatterBox AI service status on mount
  useEffect(() => {
    const checkAiVoiceService = async () => {
      try {
        const response = await axios.get(`${apiUrl}/voices/health`);
        if (response.data.status === 'ok' && response.data.python_service === 'online') {
          setAiVoiceReady(true);
          console.log('✅ ChatterBox AI Voice service is ready');
        } else {
          // Service exists but Python TTS is offline - don't spam console
          setAiVoiceReady(false);
        }
      } catch (error) {
        // Service not available - silently disable voice features
        setAiVoiceReady(false);
      }
    };
    
    checkAiVoiceService();
  }, [apiUrl]);

  // Translation helper function
  const translateTicketText = (ticketNumber, counterNumber, langCode) => {
    const translations = {
      'en': {
        text: `Ticket number ${ticketNumber} please come to counter ${counterNumber}`
      },
      'ar-ae': {
        text: `التذكره رقم بي -${ticketNumber} الذهاب إلى الكونتر رقم ${counterNumber}`
      },
      'ar': {
        text: `تذكرة رقم ${ticketNumber} الرجاء الذهاب لكونتر رقم ${counterNumber}`
      },
      'ur': {
        text: `ٹکٹ نمبر ${ticketNumber} براہ کرم کاؤنٹر نمبر ${counterNumber} پر تشریف لے جائیں`
      },
      'hi': {
        text: `टिकट नंबर ${ticketNumber} कृपया काउंटर नंबर ${counterNumber} पर जाएं`
      },
      'es': {
        text: `Número de ticket ${ticketNumber} por favor vaya al mostrador número ${counterNumber}`
      }
    };
    
    return translations[langCode] || translations['en'];
  };

  // Enable audio on user click
  const handleEnableAudio = async () => {
    try {
      // Initialize AudioContext
      if (typeof window !== 'undefined') {
        if (!window.audioContext) {
          window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
        }
      }
      
      // Play silent audio to unlock
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.volume = 0.001;
      await silentAudio.play();
      silentAudio.pause();
      
      setAudioUnlocked(true);
      setAudioEnabled(true);
      console.log('✅ Audio enabled by user interaction');
      return true;
    } catch (e) {
      console.error('❌ Failed to enable audio:', e);
      return false;
    }
  };

  // ✅ AUTO-ENABLE audio on page load (for display screens)
  useEffect(() => {
    const autoEnableAudio = async () => {
      console.log('🔊 Auto-enabling audio for display screen...');
      
      // Force enable immediately
      setAudioEnabled(true);
      setAudioUnlocked(true);
      
      try {
        // Try silent enable first
        const success = await handleEnableAudio();
        if (success) {
          console.log('✅ Audio auto-enabled successfully');
          return;
        }
      } catch (e) {
        console.log('⚠️ Silent enable failed, audio will play on first announcement');
      }
    };
    
    // Enable immediately on mount
    autoEnableAudio();
    
    // Also enable on any user interaction (mousemove, scroll, etc)
    const enableOnInteraction = () => {
      handleEnableAudio();
      // Remove listeners after first interaction
      ['mousemove', 'scroll', 'touchstart', 'click'].forEach(evt => 
        document.removeEventListener(evt, enableOnInteraction)
      );
    };
    
    ['mousemove', 'scroll', 'touchstart', 'click'].forEach(evt => 
      document.addEventListener(evt, enableOnInteraction, { once: true, passive: true })
    );
  }, []);

  // Silent background audio enabler - no user interaction needed
  const enableAudioSilently = async () => {
    try {
      // Initialize AudioContext
      if (typeof window !== 'undefined') {
        if (!window.audioContext) {
          window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
        }
      }
      
      // Play silent audio to unlock
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.volume = 0.001;
      await silentAudio.play();
      silentAudio.pause();
      
      setAudioUnlocked(true);
      console.log('✅ Audio enabled silently in background');
      return true;
    } catch (e) {
      console.log('⚠️ Silent audio enable attempt...');
      return false;
    }
  };

  // Continuous background audio enabler - runs automatically
  useEffect(() => {
    let enableInterval;
    
    // Start trying to enable audio immediately and continuously
    const tryEnableAudio = async () => {
      try {
        if (typeof window !== 'undefined') {
          if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (window.audioContext.state === 'suspended') {
            await window.audioContext.resume();
          }
        }
        
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.001;
        await silentAudio.play();
        silentAudio.pause();
        
        setAudioUnlocked(true);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    // Try immediately on mount
    tryEnableAudio();
    
    // Keep trying every 500ms until successful
    enableInterval = setInterval(() => {
      tryEnableAudio().then(success => {
        if (success) {
          clearInterval(enableInterval);
        }
      });
    }, 500);
    
    return () => {
      if (enableInterval) clearInterval(enableInterval);
    };
  }, []);

  // Auto-enable audio on any user interaction (background - no UI)
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!audioUnlocked) {
        await enableAudioSilently();
      } else if (window.audioContext && window.audioContext.state === 'suspended') {
        await window.audioContext.resume();
      }
    };
    
    const events = ['click', 'touchstart', 'keydown', 'mousedown', 'mousemove', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true, once: false });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [audioUnlocked]);

  // Initialize AudioContext on mount and keep it active
  useEffect(() => {
    // Auto-enable audio silently on page load
    console.log('🔊 Auto-enabling audio in background...');
    
    // Initialize AudioContext
    if (typeof window !== 'undefined' && !window.audioContext) {
      try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ AudioContext created');
      } catch (e) {
        console.log('⚠️ AudioContext creation failed:', e);
      }
    }
    
    // Attempt silent unlock
    const unlockAudio = async () => {
      try {
        if (window.audioContext && window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
          console.log('✅ AudioContext resumed');
        }
        
        // Create and play silent audio
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.001;
        
        try {
          await silentAudio.play();
          silentAudio.pause();
          silentAudio.remove();
          setAudioUnlocked(true);
          console.log('✅ Audio auto-enabled successfully (silent)');
        } catch (playError) {
          // If autoplay fails, retry periodically
          console.log('⚠️ Silent audio play blocked, will retry on interaction...');
        }
      } catch (e) {
        console.log('⚠️ Audio unlock attempt:', e.name);
      }
    };
    
    unlockAudio();
      
    // Keep AudioContext resumed and retry audio unlock
    const contextResumeInterval = setInterval(async () => {
      if (window.audioContext && window.audioContext.state === 'suspended') {
        await window.audioContext.resume().catch(() => {});
      }
      // Retry silent unlock if not yet unlocked
      if (!audioUnlocked) {
        unlockAudio();
      }
    }, 1000);
    
    return () => clearInterval(contextResumeInterval);
  }, []);

  // Announce ticket using ChatterBox AI with admin-configured settings
  const announceTicket = async (ticketNumber, counterNumber) => {
    if (!aiVoiceReady) {
      console.error('❌ ChatterBox AI Voice service not ready');
      alert('⚠️ Voice service offline - announcement skipped');
      return;
    }

    // Prevent overlapping announcements
    if (isAnnouncing) {
      console.warn('⚠️ Announcement already in progress, skipping...');
      return;
    }

    setIsAnnouncing(true);
    console.log('🔒 Announcement started - locked');
    
    // ✅ UPDATE DISPLAY IMMEDIATELY when announcement starts (not at the end)
    console.log('🔄 Updating display NOW: Ticket', ticketNumber, 'Counter', counterNumber);
    setDisplayedTicket(ticketNumber);
    setDisplayedCounter(counterNumber);
    
    // Show visual feedback that announcement is starting (for production debugging)
    if (typeof window !== 'undefined' && window.document) {
      document.title = `🔊 Announcing ${ticketNumber}`;
    }

    // Get admin's saved TTS settings from database first, then localStorage
    let settings = {
      selectedChatterboxVoice: 'male',  // Default to 'male' instead of 'default'
      speechRate: 0.9,
      speechPitch: 1.0,
      selectedLanguages: ['en'] // Support multiple languages
    };
    
    try {
      // Try to load from database with authentication token
      // Add timestamp to prevent caching of old settings
      const token = getToken();
      const user = getUser();
      
      console.log('🔑 Fetching FRESH voice settings with auth token:', token ? 'Present' : 'Missing');
      console.log('👤 Current user:', user?.username, '| Role:', user?.role, '| Admin ID:', user?.admin_id);
      
      // Build URL with admin_id if available (for ticket_info users)
      let settingsUrl = `${apiUrl}/voices/settings`;
      const params = new URLSearchParams();
      params.append('t', Date.now().toString());
      
      if (user?.admin_id) {
        params.append('adminId', user.admin_id.toString());
        console.log('📌 Fetching settings for admin_id:', user.admin_id);
      }
      
      settingsUrl += `?${params.toString()}`;
      console.log('🌐 Full settings URL:', settingsUrl);
      
      const response = await axios.get(settingsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📦 Voice settings response (FRESH):', response.data);
      console.log('📦 Settings received:', response.data?.settings);
      
      if (response.data.success && response.data.settings) {
        const dbSettings = response.data.settings;
        
        console.log('🎯 Database settings received:', {
          voice_type: dbSettings.voice_type,
          language: dbSettings.language,
          languages: dbSettings.languages,
          speech_rate: dbSettings.speech_rate,
          speech_pitch: dbSettings.speech_pitch
        });
        
        // Parse languages array
        let languages = ['en'];
        if (dbSettings.languages) {
          try {
            languages = JSON.parse(dbSettings.languages);
            console.log('✅ Parsed languages array:', languages);
          } catch (e) {
            console.warn('⚠️ Failed to parse languages, using single language');
            languages = [dbSettings.language || 'en'];
          }
        } else if (dbSettings.language) {
          languages = [dbSettings.language];
          console.log('✅ Using single language:', languages);
        }
        
        settings = {
          selectedChatterboxVoice: dbSettings.voice_type || 'male',
          speechRate: parseFloat(dbSettings.speech_rate) || 0.9,
          speechPitch: parseFloat(dbSettings.speech_pitch) || 1.0,
          selectedLanguages: languages
        };
        console.log('✅ FINAL settings from database:', settings);
      } else {
        console.log('⚠️ No custom settings found in database, using defaults:', settings);
      }
    } catch (error) {
      console.error('❌ ERROR fetching voice settings from database:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.message);
      console.error('   Response:', error.response?.data);
      
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('tts_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          settings.selectedLanguages = parsed.selectedLanguages || [parsed.preferredLanguage || 'en'];
          settings.selectedChatterboxVoice = parsed.selectedChatterboxVoice || 'male';
          settings.speechRate = parseFloat(parsed.speechRate) || 0.9;
          settings.speechPitch = parseFloat(parsed.speechPitch) || 1.0;
          console.log('✅ Fallback: Using localStorage settings:', settings);
        } catch (e) {
          console.error('❌ Error parsing localStorage TTS settings:', e);
          console.log('⚠️ Using hardcoded defaults:', settings);
        }
      } else {
        console.log('⚠️ No localStorage settings found, using hardcoded defaults:', settings);
      }
    }
    
    console.log('═══════════════════════════════════════════════');
    console.log('🎙️ TICKET ANNOUNCEMENT - SETTINGS BEING USED:');
    console.log('═══════════════════════════════════════════════');
    console.log('  🎫 Ticket:', ticketNumber);
    console.log('  🏪 Counter:', counterNumber);
    console.log('  🌐 Languages:', settings.selectedLanguages);
    console.log('  🎤 Voice Type:', settings.selectedChatterboxVoice);
    console.log('  ⚡ Speech Rate:', settings.speechRate);
    console.log('  🎵 Speech Pitch:', settings.speechPitch);
    console.log('═══════════════════════════════════════════════');
    
    // Stop any existing audio (cleanup)
    if (typeof window !== 'undefined') {
      const existingAudios = document.querySelectorAll('audio');
      existingAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.remove();
      });
      console.log('🧹 Cleaned up existing audio elements');
    }
    
    try {
      // Announce in each selected language sequentially (Box 1 first, then Box 2)
      for (let i = 0; i < settings.selectedLanguages.length; i++) {
        const lang = settings.selectedLanguages[i];
        const translation = translateTicketText(ticketNumber, counterNumber, lang);
        
        console.log(`📢 Box ${i + 1}: Announcing in ${lang}:`, translation.text);
        
        // Call ChatterBox AI synthesis endpoint
        const response = await axios.post(`${apiUrl}/voices/synthesize`, {
          text: translation.text,
          voice_type: settings.selectedChatterboxVoice || 'male',  // ✅ Fallback to 'male' instead of 'default'
          speed: settings.speechRate || 0.9,  // ✅ Changed from 'rate' to 'speed'
          pitch: settings.speechPitch || 1.0,
          language: lang
        });
        
        if (response.data.success && response.data.audioUrl) {
          console.log(`✅ Box ${i + 1} audio generated:`, response.data.audioUrl);
          
          // Construct proper audio URL - add cache buster
          let audioUrl = response.data.audioUrl;
          
          // If URL is relative, make it absolute
          if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
            // Use Python TTS service URL (default: http://localhost:3002)
            const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_TTS_URL || 'http://localhost:3002';
            audioUrl = `${pythonServiceUrl}${audioUrl}`;
          }
          
          // Add cache buster to prevent caching issues
          audioUrl = `${audioUrl}?t=${Date.now()}`;
          
          console.log(`🔊 Box ${i + 1} final audio URL:`, audioUrl);
          
          // Verify audio file exists before playing
          try {
            const checkResponse = await fetch(audioUrl, { method: 'HEAD' });
            if (!checkResponse.ok) {
              console.error(`❌ Box ${i + 1} audio file not accessible (${checkResponse.status})`);
              continue; // Skip this language and move to next
            }
            console.log(`✅ Box ${i + 1} audio file verified and accessible`);
          } catch (checkError) {
            console.error(`❌ Box ${i + 1} audio check failed:`, checkError);
            continue; // Skip this language
          }
          
          // Play audio and wait for completion before next language
          await new Promise((resolve, reject) => {
            const audio = new Audio();
            
            // ✅ HIGH QUALITY AUDIO PLAYBACK SETTINGS
            audio.volume = 0.95; // Slightly reduced to prevent clipping/distortion
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous';
            
            // Enable better audio processing (if supported by browser)
            if ('mozPreservesPitch' in audio) {
              audio.mozPreservesPitch = true; // Firefox
            }
            if ('webkitPreservesPitch' in audio) {
              audio.webkitPreservesPitch = true; // Chrome/Safari
            }
            if ('preservesPitch' in audio) {
              audio.preservesPitch = true; // Standard
            }
            
            // Set src AFTER setting up event listeners to avoid race conditions
            let isResolved = false;
            let playbackTimeout = null;
            
            // Cleanup function
            const cleanup = () => {
              if (playbackTimeout) clearTimeout(playbackTimeout);
              try {
                audio.pause();
                audio.src = '';
                audio.remove();
              } catch (e) {}
            };
            
            audio.onloadeddata = () => {
              console.log(`✅ Box ${i + 1} audio data loaded, starting playback...`);
            };
            
            audio.oncanplaythrough = () => {
              console.log(`✅ Box ${i + 1} audio can play through, duration: ${audio.duration}s`);
            };
            
            audio.onplay = () => {
              console.log(`▶️ Box ${i + 1} (${lang}) announcement started`);
              // Set a maximum timeout based on audio duration + buffer
              const maxDuration = (audio.duration || 30) * 1000 + 5000; // duration + 5s buffer
              playbackTimeout = setTimeout(() => {
                if (!isResolved) {
                  console.log(`⏰ Box ${i + 1} timeout reached, moving on...`);
                  isResolved = true;
                  cleanup();
                  resolve();
                }
              }, maxDuration);
            };
            
            audio.onended = () => {
              if (isResolved) return;
              isResolved = true;
              console.log(`✅ Box ${i + 1} (${lang}) announcement completed successfully`);
              cleanup();
              resolve();
            };
            
            let hasErrored = false; // Prevent infinite error loop
            
            audio.onerror = (e) => {
              if (hasErrored || isResolved) {
                console.log(`⏭️ Already handled error for Box ${i + 1}, skipping`);
                return;
              }
              hasErrored = true;
              isResolved = true;
              
              console.error(`❌ Box ${i + 1} audio error:`, e);
              console.error(`❌ Failed audio URL:`, audioUrl);
              console.error(`❌ Audio error code:`, audio.error?.code);
              console.error(`❌ Audio error message:`, audio.error?.message);
              
              cleanup();
              resolve(); // Continue to next language
            };
            
            // Set source and load
            audio.src = audioUrl;
            audio.load(); // Explicitly load the audio
            
            // Handle autoplay policy with user interaction requirement
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log(`✅ Box ${i + 1} audio playing successfully`);
                  setAudioUnlocked(true); // Mark as unlocked on successful play
                })
                .catch(error => {
                  if (isResolved) return;
                  
                  console.warn(`⚠️ Box ${i + 1} play blocked by browser:`, error.name);
                  
                  // For NotAllowedError (autoplay blocked by browser)
                  if (error.name === 'NotAllowedError') {
                    console.log('🔄 AUTOPLAY BLOCKED - Auto-retrying on next interaction...');
                    
                    // Auto-retry with aggressive approach
                    const retryPlay = async () => {
                      try {
                        // Force resume AudioContext
                        if (window.audioContext) {
                          if (window.audioContext.state === 'suspended') {
                            await window.audioContext.resume();
                          }
                          if (window.audioContext.state !== 'running') {
                            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                          }
                        }
                        
                        // Retry play immediately
                        await audio.play();
                        console.log(`✅ Box ${i + 1} audio playing after auto-retry`);
                        setAudioUnlocked(true);
                        setAudioEnabled(true);
                      } catch (retryError) {
                        // Silent fail - continue to next language
                        console.log(`⏭️ Box ${i + 1} skipped (browser policy)`);
                        if (!isResolved) {
                          isResolved = true;
                          cleanup();
                          resolve();
                        }
                      }
                    };
                    
                    // Aggressive retry: multiple attempts
                    setTimeout(() => retryPlay(), 50);
                    setTimeout(() => retryPlay(), 200);
                    setTimeout(() => retryPlay(), 500);
                    
                    // Also setup listeners for any page interaction
                    const interactionEvents = ['mousemove', 'scroll', 'touchstart', 'click', 'keydown'];
                    const handleInteraction = () => {
                      retryPlay();
                      interactionEvents.forEach(evt => 
                        document.removeEventListener(evt, handleInteraction)
                      );
                    };
                    
                    interactionEvents.forEach(evt => 
                      document.addEventListener(evt, handleInteraction, { once: true, passive: true })
                    );
                  } else {
                    // For other errors, cleanup and continue
                    console.error(`❌ Box ${i + 1} playback error:`, error.message);
                    if (!isResolved) {
                      isResolved = true;
                      cleanup();
                      resolve();
                    }
                  }
                });
            }
          }).catch(err => {
            console.error(`❌ Promise rejected for Box ${i + 1}:`, err);
            // Continue even if this language fails
          });
          
          // Small pause between languages (200ms) - pehli complete hone ke turant baad dosri
          if (i < settings.selectedLanguages.length - 1) {
            console.log(`⏸️ Pausing 200ms before Box ${i + 2}...`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          console.error(`❌ Box ${i + 1} synthesis failed:`, response.data);
        }
      }
      
      console.log('✅ All language announcements completed');
      
      // Display was already updated at START of announcement
      
      // Restore title
      if (typeof window !== 'undefined' && window.document) {
        document.title = 'Ticket Info Display';
      }
    } catch (error) {
      console.error('❌ ChatterBox AI announcement error:', error.message);
      // Show error for debugging on production
      if (typeof window !== 'undefined' && window.document) {
        document.title = `❌ Error: ${error.message}`;
        setTimeout(() => {
          document.title = 'Ticket Info Display';
        }, 5000);
      }
    } finally {
      setIsAnnouncing(false);
      console.log('🔓 Announcement ended - unlocked');
      
      // Check if there are pending tickets in queue
      setAnnouncementQueue(prev => {
        if (prev.length > 0) {
          const nextTicket = prev[0];
          console.log('📢 Processing next ticket from queue:', nextTicket);
          
          // Update display with next ticket
          setTimeout(() => {
            setCalledTicket(nextTicket.ticket);
            setCurrentCounter(nextTicket.counter);
            setLastAnnouncedTime(nextTicket.timestamp);
          }, 500); // Small delay before next ticket
          
          // Remove processed ticket from queue
          return prev.slice(1);
        }
        return prev;
      });
    }
  };

  // Voice announcement when new ticket is called
  useEffect(() => {
    console.log('🔊 Voice effect triggered with:', {
      lastAnnouncedTime,
      lastVoiceTime,
      calledTicket,
      currentCounter,
      aiVoiceReady,
      isAnnouncing,
      queueLength: announcementQueue.length,
      timeDiff: lastAnnouncedTime && lastVoiceTime ? lastAnnouncedTime - lastVoiceTime : 'N/A'
    });
    
    // Check if announcement is already in progress
    if (isAnnouncing) {
      console.log('⚠️ Announcement in progress, ignoring new trigger');
      return;
    }
    
    // Only trigger announcement if we have a new ticket and all languages can complete
    if (lastAnnouncedTime && lastAnnouncedTime !== lastVoiceTime && calledTicket && aiVoiceReady) {
      console.log('✅ All conditions met, scheduling AI voice announcement');
      console.log('📊 Announcement details:', {
        ticket: calledTicket,
        counter: currentCounter,
        timestamp: new Date(lastAnnouncedTime).toISOString()
      });
      setLastVoiceTime(lastAnnouncedTime);
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        console.log('🎤 Calling announceTicket function NOW');
        console.log('🔒 Display will remain locked until ALL languages complete');
        announceTicket(calledTicket, currentCounter)
          .catch(error => {
            console.error('❌ announceTicket failed:', error);
            setIsAnnouncing(false); // Unlock on error
          });
      }, 150);
    } else {
      if (!lastAnnouncedTime) console.log('⏸️ Waiting: lastAnnouncedTime is null');
      if (lastAnnouncedTime === lastVoiceTime) console.log('⏸️ Skipping: Already announced this ticket');
      if (!calledTicket) console.log('⏸️ Waiting: calledTicket is empty');
      if (!aiVoiceReady) console.log('⏸️ Waiting: ChatterBox AI service not ready');
    }
  }, [lastAnnouncedTime, calledTicket, currentCounter, lastVoiceTime, aiVoiceReady, isAnnouncing, announcementQueue]);

  return (
    <ProtectedRoute allowedRoles={['ticket_info']}>
      <div className="flex flex-row h-screen w-full bg-white text-white font-sans overflow-hidden">
      {/* Left Panel: Counter Table */}
      <div className="flex-[0_0_30%] bg-green-700 flex flex-col border-r-[3px] border-[#fdbb2d] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-green-700 text-[38.4px] text-white text-center p-2 font-bold shadow-lg rounded-lg">
                Ticket
              </th>
              <th className="bg-green-700 text-[38.4px] text-white text-center p-2 font-bold shadow-lg rounded-lg">
                Counter
              </th>
            </tr>
          </thead>
          <tbody>
            {calledTickets.length === 0 ? (
              <tr>
                <td colSpan="2" className="bg-white text-gray-500 text-[24px] text-center py-8">
                  No tickets called yet
                </td>
              </tr>
            ) : (
              (() => {
                // Filter unique tickets by ticket_number AND ensure status is 'called' (case-insensitive)
                const filteredForDisplay = calledTickets.filter(ticket => 
                  ticket.status && ticket.status.toLowerCase() === 'called'
                );
                console.log('🖥️ DISPLAY TABLE: Rendering tickets:', filteredForDisplay.map(t => ({
                  ticket: t.ticket_number,
                  status: t.status,
                  counter: t.counter_no
                })));
                
                // Get unique tickets and sort: current calling ticket at top
                const uniqueTickets = Array.from(new Map(
                  filteredForDisplay.map(item => [item.ticket_number, item])
                ).values());
                
                // Normalize ticket numbers for comparison (remove spaces, lowercase)
                const normalizeTicket = (ticket) => {
                  return ticket ? String(ticket).toLowerCase().trim() : '';
                };
                
                // Use displayedTicket (currently announcing) for sorting, not calledTicket
                const currentTicketNormalized = normalizeTicket(displayedTicket);
                
                console.log('🎯 Current ANNOUNCING ticket (normalized):', currentTicketNormalized);
                console.log('🎯 All tickets in table:', uniqueTickets.map(t => normalizeTicket(t.ticket_number)));
                
                // Sort: currently ANNOUNCING ticket first (displayedTicket), then rest by time
                const sortedTickets = uniqueTickets.sort((a, b) => {
                  const aNormalized = normalizeTicket(a.ticket_number);
                  const bNormalized = normalizeTicket(b.ticket_number);
                  
                  // If this is the currently calling ticket, move to top
                  if (aNormalized === currentTicketNormalized) return -1;
                  if (bNormalized === currentTicketNormalized) return 1;
                  // Otherwise sort by called_at (newest first)
                  return new Date(b.called_at) - new Date(a.called_at);
                });
                
                return sortedTickets
                  .slice(0, 10) // Show top 10
                  .map((item, index) => {
                    // Highlight the currently ANNOUNCING ticket (displayedTicket)
                    const isCurrentTicket = normalizeTicket(item.ticket_number) === currentTicketNormalized;
                    const bgColor = isCurrentTicket ? 'bg-yellow-200' : 'bg-white';
                    const textWeight = isCurrentTicket ? 'font-bold' : 'font-bold';
                    
                    return (
                      <tr key={index} className={`border-b-1 border-[#e6e9ec] ${isCurrentTicket ? 'animate-pulse' : ''}`}>
                        <td className={`${bgColor} text-black uppercase text-[60px] text-center align-middle ${textWeight} lg:text-[4vw] md:text-[5vw] sm:text-[7vw]`}>
                          {item.ticket_number}
                        </td>
                        <td className={`${bgColor} text-black text-[60px] text-center align-middle ${textWeight} lg:text-[3vw] md:text-[5vw] sm:text-[7vw]`}>
                          {item.counter_no || 'N/A'}
                        </td>
                      </tr>
                    );
                  });
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* Right Panel: Header, Slider, and News Ticker */}
      <div className="flex-[0_0_70%] flex flex-col relative">
        
        {/* Header Section */}
        <div className="w-full flex justify-around items-center bg-white/95 shadow-lg h-[200px] border-b border-gray-300">
          {/* Left Logo - Dynamic from database */}
          <div className="flex-[0_0_30%] text-center">
            {leftLogoUrl ? (
              <img
                src={`${apiUrlWs}${leftLogoUrl}`}
                alt="Left Logo"
                className="w-full h-[150px] mx-auto object-contain"
              />
            ) : (
              <img
                src="https://ded.techsolutionor.com/assets/img/logo/DEDpreview.png"
                alt="Logo"
                className="w-full h-[150px] mx-auto object-contain"
              />
            )}
          </div>
          
          {/* Now Calling Section */}
          <div className="flex-[0_0_40%] text-center border-l-[5px] border-r-[5px] border-gray-300">
            <div className="text-black font-bold text-[40px]">
              <b className="text-red-600 text-[50px]">Now Calling</b>
              <br />
              <span className="text-[50px] uppercase font-bold">{displayedTicket || 'Waiting...'}</span>
              {displayedTicket && (
                <>
                  <span className="inline-block w-[50px] h-[6px] bg-black align-middle mx-2"></span>
                  <span className="text-[50px] font-bold">{displayedCounter || 'N/A'}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Right Logo - Dynamic from database */}
          <div className="flex-[0_0_30%] text-center">
            {rightLogoUrl ? (
              <img
                src={`${apiUrlWs}${rightLogoUrl}`}
                alt="Right Logo"
                className="w-full h-[150px] mx-auto object-contain"
              />
            ) : (
              <img
                src="https://epbc.techsolutionor.com/assets/img/logo/image-removebg-preview.png"
                alt="Logo"
                className="w-full h-[150px] mx-auto object-contain"
              />
            )}
          </div>
        </div>

        {/* Content Area - Video or Image Slider */}
        <div className="relative w-full h-[calc(100%-15vh)] rounded-lg overflow-hidden mb-0 bg-white">
          {contentType === 'video' && videoUrl ? (
            // Video Display
            <video
              src={`${apiUrlWs}${videoUrl}`}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted
            />
          ) : contentType === 'images' && sliderImages.length > 0 ? (
            // Image Slider Display
            <>
              {sliderImages.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </>
          ) : (
            // No content configured - show placeholder
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <p className="text-xl">No content configured</p>
                <p className="text-sm mt-2">Please upload images or video from admin panel</p>
              </div>
            </div>
          )}
        </div>

        {/* News Ticker - Dynamic from database */}
        <div className="w-full bg-[#333] text-white p-4 text-center text-[3vh] font-bold h-[8vh] flex items-center justify-center">
          <marquee>{tickerContent}</marquee>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flex-[0_0_30%] {
            flex: 0 0 100%;
            height: auto;
            overflow-y: auto;
          }
          .flex-[0_0_70%] {
            display: none;
          }
        }
      `}</style>
    </div>
    </ProtectedRoute>
  );
}

// Export wrapped component with Suspense
export default function TicketInfo() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <TicketInfoContent />
    </Suspense>
  );
}
