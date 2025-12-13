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
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  
  // Counter Display Config from database
  const [leftLogoUrl, setLeftLogoUrl] = useState('');
  const [rightLogoUrl, setRightLogoUrl] = useState('');
  const [contentType, setContentType] = useState('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [sliderTimer, setSliderTimer] = useState(5);
  const [tickerContent, setTickerContent] = useState('Welcome to Dubai Economic Department Services');
  
  const slides = ['/assets/img/33.png', '/assets/img/22.png', '/assets/img/11.png'];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
      if (!token) {
        console.warn('⚠️ No token found - cannot fetch display config');
        return;
      }

      const response = await axios.get(`${apiUrl}/counter-display/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const { config, images } = response.data;
        
        if (config) {
          setLeftLogoUrl(config.left_logo_url || '');
          setRightLogoUrl(config.right_logo_url || '');
          setContentType(config.content_type || 'video');
          setVideoUrl(config.video_url || '');
          setSliderTimer(config.slider_timer || 5);
          setTickerContent(config.ticker_content || 'Welcome to Dubai Economic Department Services');
          
          console.log('✅ Display config loaded:', config);
        }
        
        // Load selected images for slider
        if (images && images.length > 0) {
          const selectedImages = images.filter(img => img.is_selected === 1);
          setSliderImages(selectedImages.map(img => `http://localhost:5000${img.image_url}`));
          console.log('✅ Slider images loaded:', selectedImages.length);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching display config:', error);
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
  }, [isAnnouncing, lastAnnouncedTime]); // Add dependencies to be aware of current state

  
  // Setup BroadcastChannel for cross-tab communication
  useEffect(() => {
    console.log('🚀 Setting up BroadcastChannel for ticket_info');
    
    // Create broadcast channel
    const channel = new BroadcastChannel('ticket-calls');
    setBroadcastChannel(channel);
    
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
      console.log('🧹 Closing BroadcastChannel');
      channel.close();
    };
  }, []);

  // Check ChatterBox AI service status on mount
  useEffect(() => {
    const checkAiVoiceService = async () => {
      console.log('🔍 Checking ChatterBox AI service at:', `${apiUrl}/voices/health`);
      try {
        const response = await axios.get(`${apiUrl}/voices/health`);
        console.log('🔍 Health check response:', response.data);
        if (response.data.status === 'ok') {
          setAiVoiceReady(true);
          console.log('✅ ChatterBox AI Voice service is ready');
        } else {
          console.warn('⚠️ Service responded but status not ok:', response.data);
          setAiVoiceReady(false);
        }
      } catch (error) {
        console.error('❌ ChatterBox AI Voice service offline:', error.message);
        console.error('Error details:', error);
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

  // Announce ticket using ChatterBox AI with admin-configured settings
  const announceTicket = async (ticketNumber, counterNumber) => {
    if (!aiVoiceReady) {
      console.error('❌ ChatterBox AI Voice service not ready');
      return;
    }

    // Prevent overlapping announcements
    if (isAnnouncing) {
      console.warn('⚠️ Announcement already in progress, skipping...');
      return;
    }

    setIsAnnouncing(true);
    console.log('🔒 Announcement started - locked');

    // Get admin's saved TTS settings from database first, then localStorage
    let settings = {
      selectedChatterboxVoice: 'default',
      speechRate: 0.9,
      speechPitch: 1.0,
      selectedLanguages: ['en'] // Support multiple languages
    };
    
    try {
      // Try to load from database with authentication token
      const token = getToken();
      console.log('🔑 Fetching voice settings with auth token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${apiUrl}/voices/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📦 Voice settings response:', response.data);
      
      if (response.data.success && response.data.settings) {
        const dbSettings = response.data.settings;
        
        // Parse languages array
        let languages = ['en'];
        if (dbSettings.languages) {
          try {
            languages = JSON.parse(dbSettings.languages);
          } catch (e) {
            languages = [dbSettings.language || 'en'];
          }
        } else if (dbSettings.language) {
          languages = [dbSettings.language];
        }
        
        settings = {
          selectedChatterboxVoice: dbSettings.voice_type || 'default',
          speechRate: dbSettings.speech_rate || 0.9,
          speechPitch: dbSettings.speech_pitch || 1.0,
          selectedLanguages: languages
        };
        console.log('✅ Using settings from database:', settings);
      } else {
        console.log('ℹ️ No custom settings found, using defaults:', settings);
      }
    } catch (error) {
      console.warn('⚠️ Could not load from database:', error.response?.status, error.message);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('tts_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          settings.selectedLanguages = parsed.selectedLanguages || [parsed.preferredLanguage || 'en'];
          settings.selectedChatterboxVoice = parsed.selectedChatterboxVoice || 'default';
          settings.speechRate = parsed.speechRate || 0.9;
          settings.speechPitch = parsed.speechPitch || 1.0;
          console.log('✅ Using admin ChatterBox AI settings from localStorage:', settings);
        } catch (e) {
          console.error('❌ Error parsing TTS settings:', e);
        }
      } else {
        console.log('ℹ️ No localStorage settings, using defaults:', settings);
      }
    }
    
    console.log('🎙️ Announcing ticket in multiple languages:');
    console.log('  🎫 Ticket:', ticketNumber);
    console.log('  🏪 Counter:', counterNumber);
    console.log('  🌐 Languages:', settings.selectedLanguages);
    console.log('  🎤 Voice:', settings.selectedChatterboxVoice);
    
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
          voiceType: settings.selectedChatterboxVoice || 'default',
          rate: settings.speechRate || 0.9,
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
          
          // Play audio and wait for completion before next language
          await new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous'; // Handle CORS
            
            audio.onplay = () => console.log(`▶️ Box ${i + 1} (${lang}) announcement started`);
            audio.onended = () => {
              console.log(`✅ Box ${i + 1} (${lang}) announcement completed`);
              // Clean up this audio element
              audio.pause();
              audio.src = '';
              audio.remove();
              resolve();
            };
            audio.onerror = (e) => {
              console.error(`❌ Box ${i + 1} audio error:`, e);
              console.error(`❌ Failed audio URL:`, audioUrl);
              console.error(`❌ Audio element:`, audio);
              audio.remove();
              reject(new Error(`Audio failed to load from ${audioUrl}`));
            };
            
            // Handle autoplay policy
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log(`✅ Box ${i + 1} audio playing`);
                })
                .catch(error => {
                  console.error(`❌ Box ${i + 1} play failed:`, error);
                  console.error(`❌ Error type:`, error.name);
                  console.error(`❌ Error message:`, error.message);
                  
                  if (i === 0) {
                    // Only show alert for first language
                    alert('🔊 Click OK to hear announcements (Browser autoplay policy)');
                  }
                  audio.play().catch(e => {
                    console.error('❌ Retry failed:', e);
                    audio.remove();
                    resolve(); // Continue to next language even if this fails
                  });
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
    } catch (error) {
      console.error('❌ ChatterBox AI announcement error:', error.message);
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
                
                const currentTicketNormalized = normalizeTicket(calledTicket);
                
                console.log('🎯 Current calling ticket (normalized):', currentTicketNormalized);
                console.log('🎯 All tickets in table:', uniqueTickets.map(t => normalizeTicket(t.ticket_number)));
                
                // Sort: current calling ticket first, then rest by time
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
                    // Highlight the currently calling ticket (case-insensitive comparison)
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
      <div className="flex-[0_0_70%] flex flex-col">
        {/* Header Section */}
        <div className="w-full flex justify-around items-center bg-white/95 shadow-lg h-[200px] border-b border-gray-300">
          {/* Left Logo - Dynamic from database */}
          <div className="flex-[0_0_25%] text-center">
            {leftLogoUrl ? (
              <img
                src={`http://localhost:5000${leftLogoUrl}`}
                alt="Left Logo"
                className="w-[150px] h-[100px] mx-auto object-contain"
              />
            ) : (
              <img
                src="https://ded.techsolutionor.com/assets/img/logo/DEDpreview.png"
                alt="Logo"
                className="w-[150px] h-[100px] mx-auto object-contain"
              />
            )}
          </div>
          
          {/* Now Calling Section */}
          <div className="flex-[0_0_50%] text-center border-l-[5px] border-r-[5px] border-gray-300">
            <div className="text-black font-bold text-[40px]">
              <b className="text-red-600 text-[50px]">Now Calling</b>
              <br />
              <span className="text-[50px] uppercase font-bold">{calledTicket || 'Waiting...'}</span>
              {calledTicket && (
                <>
                  <span className="inline-block w-[50px] h-[6px] bg-black align-middle mx-2"></span>
                  <span className="text-[50px] font-bold">{currentCounter || 'N/A'}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Right Logo - Dynamic from database */}
          <div className="flex-[0_0_25%] text-center">
            {rightLogoUrl ? (
              <img
                src={`http://localhost:5000${rightLogoUrl}`}
                alt="Right Logo"
                className="w-[150px] h-[100px] mx-auto object-contain"
              />
            ) : (
              <img
                src="https://epbc.techsolutionor.com/assets/img/logo/image-removebg-preview.png"
                alt="Logo"
                className="w-[150px] h-[100px] mx-auto object-contain"
              />
            )}
          </div>
        </div>

        {/* Content Area - Video or Image Slider */}
        <div className="relative w-full h-[calc(100%-15vh)] rounded-lg overflow-hidden mb-0 bg-white">
          {contentType === 'video' && videoUrl ? (
            // Video Display
            <video
              src={`http://localhost:5000${videoUrl}`}
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
            // Fallback to default slides if no config
            <>
              {slides.map((slide, index) => (
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
