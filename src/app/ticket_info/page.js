'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import ProtectedRoute from '@/Components/ProtectedRoute';
import { getToken, getUser } from '@/utils/sessionStorage';

function TicketInfoContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calledTicket, setCalledTicket] = useState('');
  const [calledTickets, setCalledTickets] = useState([]);
  const [currentCounter, setCurrentCounter] = useState('');
  const [lastAnnouncedTime, setLastAnnouncedTime] = useState(null);
  const [lastVoiceTime, setLastVoiceTime] = useState(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const slides = ['/assets/img/33.png', '/assets/img/22.png', '/assets/img/11.png'];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Fetch called tickets and update display
  const fetchCalledTickets = async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;
    
    try {
      const response = await fetch(`${apiUrl}/user/called-tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Backend tickets response:', data);
        
        if (data.success && data.tickets && data.tickets.length > 0) {
          setCalledTickets(data.tickets);
          
          // Get the latest ticket (first one - sorted by called_at DESC)
          const latestTicket = data.tickets[0];
          const latestTimestamp = new Date(latestTicket.called_at).getTime();
          
          console.log('🎫 Latest ticket from backend:', {
            ticket: latestTicket.ticket_number,
            counter: latestTicket.counter_no,
            called_at: latestTicket.called_at,
            timestamp: latestTimestamp
          });
          
          // Check if this is a NEW ticket (different timestamp or ticket number)
          if (!lastAnnouncedTime || latestTimestamp > lastAnnouncedTime) {
            console.log('🆕 NEW TICKET DETECTED!');
            console.log('🔄 Updating display and triggering voice');
            
            setCalledTicket(latestTicket.ticket_number);
            setCurrentCounter(latestTicket.counter_no || 'N/A');
            setLastAnnouncedTime(latestTimestamp);
          } else {
            console.log('ℹ️ Same ticket, no update needed');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching called tickets:', error);
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 9000);

    return () => clearInterval(slideInterval);
  }, []);

  // Fetch called tickets on mount and set up polling
  useEffect(() => {
    console.log('🔄 Starting ticket polling...');
    fetchCalledTickets();
    const pollInterval = setInterval(() => {
      console.log('🔃 Polling backend for new tickets...');
      fetchCalledTickets();
    }, 2000); // Check every 2 seconds
    return () => {
      console.log('⏹️ Stopping ticket polling');
      clearInterval(pollInterval);
    };
  }, []);

  
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
        
        // Update display immediately
        setCalledTicket(ticket);
        setCurrentCounter(counter || 'N/A');
        setLastAnnouncedTime(timestamp);
        
        console.log('✅ State updated successfully');
        
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

  // Load available voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          console.log('Voices loaded:', voices.length);
        }
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Announce ticket using admin-configured TTS settings
  const announceTicket = (ticketNumber, counterNumber) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Get admin's saved TTS settings from localStorage
    const savedSettings = localStorage.getItem('tts_settings');
    let settings = {
      selectedVoice: '',
      speechRate: 0.9,
      speechPitch: 1.0
    };
    
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
        console.log('Using admin TTS settings:', settings);
      } catch (e) {
        console.error('Error parsing TTS settings:', e);
      }
    }
    
    // Create announcement text
    const counterText = counterNumber ? ` counter ${counterNumber}` : '';
    const text = `Ticket number ${ticketNumber}${counterText}`;
    console.log('Announcing:', text);
    
    // Create speech utterance with admin's configured settings
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate || 0.9;
    utterance.pitch = settings.speechPitch || 1.0;
    
    // Set the voice admin selected
    if (settings.selectedVoice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === settings.selectedVoice);
      if (voice) {
        utterance.voice = voice;
        console.log('Using admin selected voice:', voice.name);
      } else {
        console.log('Admin voice not found, using default');
      }
    }
    
    // Event listeners for debugging
    utterance.onstart = () => console.log('✅ Voice announcement started');
    utterance.onend = () => console.log('✅ Voice announcement completed');
    utterance.onerror = (e) => console.error('❌ Voice error:', e);
    
    // Speak the announcement
    window.speechSynthesis.speak(utterance);
  };

  // Voice announcement when new ticket is called
  useEffect(() => {
    console.log('🔊 Voice effect triggered with:', {
      lastAnnouncedTime,
      lastVoiceTime,
      calledTicket,
      currentCounter,
      voicesLoaded
    });
    
    if (lastAnnouncedTime && lastAnnouncedTime !== lastVoiceTime && calledTicket && voicesLoaded) {
      console.log('✅ All conditions met, scheduling voice announcement');
      setLastVoiceTime(lastAnnouncedTime);
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        console.log('🎤 Calling announceTicket function');
        announceTicket(calledTicket, currentCounter);
      }, 150);
    } else {
      if (!lastAnnouncedTime) console.log('⏸️ Waiting: lastAnnouncedTime is null');
      if (lastAnnouncedTime === lastVoiceTime) console.log('⏸️ Skipping: Already announced this ticket');
      if (!calledTicket) console.log('⏸️ Waiting: calledTicket is empty');
      if (!voicesLoaded) console.log('⏸️ Waiting: voices not loaded yet');
    }
  }, [lastAnnouncedTime, calledTicket, currentCounter, lastVoiceTime, voicesLoaded]);

  return (
    <ProtectedRoute>
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
              // Filter unique tickets by ticket_number
              Array.from(new Map(calledTickets.map(item => [item.ticket_number, item])).values())
                .slice(-10)
                .reverse()
                .map((item, index) => (
                  <tr key={index} className="border-b-1 border-[#e6e9ec]">
                    <td className="bg-white text-black text-[60px] text-center align-middle lg:text-[4vw] md:text-[5vw] sm:text-[7vw]">
                      {item.ticket_number}
                    </td>
                    <td className="bg-white text-black text-[60px] text-center align-middle lg:text-[3vw] md:text-[5vw] sm:text-[7vw]">
                      {item.counter_no || 'N/A'}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Right Panel: Header, Slider, and News Ticker */}
      <div className="flex-[0_0_70%] flex flex-col">
        {/* Header Section */}
        <div className="w-full flex justify-around items-center bg-white/95 shadow-lg h-[200px] border-b border-gray-300">
          <div className="flex-[0_0_25%] text-center">
            <img
              src="https://ded.techsolutionor.com/assets/img/logo/DEDpreview.png"
              alt="Logo"
              className="w-[150px] h-[100px] mx-auto"
            />
          </div>
          <div className="flex-[0_0_50%] text-center border-l-[5px] border-r-[5px] border-gray-300">
            <div className="text-black font-bold text-[40px]">
              <b className="text-red-600 text-[50px]">Now Calling</b>
              <br />
              <span className="text-[50px] font-bold">{calledTicket || 'Waiting...'}</span>
              {calledTicket && (
                <>
                  <span className="inline-block w-[50px] h-[6px] bg-black align-middle mx-2"></span>
                  <span className="text-[50px] font-bold">{currentCounter || 'N/A'}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-[0_0_25%] text-right">
            <img
              src="https://epbc.techsolutionor.com/assets/img/logo/image-removebg-preview.png"
              alt="Logo"
              className="w-[200px] h-auto mr-8 mb-1"
            />
          </div>
        </div>

        {/* Image Slider */}
        <div className="relative w-full h-[calc(100%-15vh)] rounded-lg overflow-hidden mb-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* News Ticker */}
        <div className="w-full bg-[#333] text-white p-4 text-center text-[3vh] font-bold h-[8vh] flex items-center justify-center">
          <marquee>Welcome to Dubai Economic Department Services</marquee>
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
