'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import { getToken, getUser } from '@/utils/sessionStorage';

export default function UserDashboard() {
  const router = useRouter();
  const [currentTicket, setCurrentTicket] = useState('');
  const [manualTicketId, setManualTicketId] = useState('');
  const [totalPending, setTotalPending] = useState(0);
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleTickets, setVisibleTickets] = useState(5);
  const [isCalling, setIsCalling] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [notSolvedReason, setNotSolvedReason] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUsername, setTransferUsername] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showNextConfirmModal, setShowNextConfirmModal] = useState(false);
  const [isNextProcessing, setIsNextProcessing] = useState(false);
  const [isTransferProcessing, setIsTransferProcessing] = useState(false);
  const [isNotSolvedProcessing, setIsNotSolvedProcessing] = useState(false);
  const [transferredTickets, setTransferredTickets] = useState([]);
  const [showCalledDrawer, setShowCalledDrawer] = useState(false);
  const [calledTickets, setCalledTickets] = useState([]);
  const [userCounter, setUserCounter] = useState(null);
  // Button settings from admin
  const [showNextButton, setShowNextButton] = useState(true);
  const [showTransferButton, setShowTransferButton] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  console.log('🔵 Dashboard states:', { 
    currentTicket, 
    unassignedCount: unassignedTickets.length, 
    transferredCount: transferredTickets.length,
    userCounter 
  });

  // ✅ Check counter on mount - CRITICAL for ticket calling
  useEffect(() => {
    const checkUserCounter = async () => {
      const token = getToken();
      const user = getUser();
      
      if (!token || !user) {
        console.error('❌ No token or user found - redirecting to login');
        router.push('/login');
        return;
      }

      try {
        // Try to fetch user's active session counter from API
        const response = await axios.get(`${apiUrl}/user/session/counter`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.counter_no) {
          setUserCounter(response.data.counter_no);
          console.log('✅ User counter verified from API:', response.data.counter_no);
        } else {
          // API returned success but no counter - check user object
          if (user.counter_no) {
            setUserCounter(user.counter_no);
            console.log('⚠️ API has no counter, using user object:', user.counter_no);
          } else {
            console.warn('⚠️ No counter found - user may not be able to call tickets');
          }
        }
      } catch (error) {
        console.warn('⚠️ Counter check API failed, using user object:', error.message);
        // If API doesn't exist or fails, check from user object
        if (user.counter_no) {
          setUserCounter(user.counter_no);
          console.log('✅ Counter from user object:', user.counter_no);
        } else {
          console.warn('⚠️ No counter in user object - tickets may not be callable');
          // DON'T block access - let backend handle validation on call
        }
      }
    };

    checkUserCounter();
  }, [router, apiUrl]);

  // Fetch button settings from admin
  useEffect(() => {
    const fetchButtonSettings = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await axios.get(`${apiUrl}/button-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setShowNextButton(response.data.settings.showNextButton);
          setShowTransferButton(response.data.settings.showTransferButton);
          console.log('✅ Button settings loaded:', response.data.settings);
        }
      } catch (error) {
        console.error('❌ Error fetching button settings:', error);
        // Default to showing buttons if API fails
        setShowNextButton(true);
        setShowTransferButton(true);
      }
    };

    fetchButtonSettings();
  }, [apiUrl]);

  const fetchAssignedTickets = async (showLoader = false) => {
    const token = getToken();
    if (!token) return;
    
    try {
      if (showLoader) setLoading(true);
      const res = await axios.get(`${apiUrl}/user/tickets/assigned?status=Pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const allTickets = res.data.tickets || [];
        const services = res.data.assignedServices || [];
        
        // Get current user's username from localStorage
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const currentUsername = currentUser?.username || '';
        
        // Separate transferred tickets from regular tickets
        const transferred = allTickets.filter(t => t.transfered === currentUsername && t.transfer_by);
        const regular = allTickets.filter(t => !(t.transfered === currentUsername && t.transfer_by));
        
        console.log(`📦 Separated tickets: Regular=${regular.length}, Transferred=${transferred.length}`);
        
        setUnassignedTickets(regular);
        setTransferredTickets(transferred);
        setTotalPending(regular.length);
        setAssignedServices(services);
        
        const tickets = regular; // ONLY regular tickets, NOT transferred
        
        // Check if current ticket exists in REGULAR or TRANSFERRED tickets
        const currentExistsInRegular = tickets.some(t => t.ticketNumber === currentTicket);
        const currentExistsInTransferred = transferred.some(t => t.ticketNumber === currentTicket);
        
        console.log(`📊 Fetched ${tickets.length} regular tickets, ${transferred.length} transferred tickets`);
        console.log(`📊 Current: ${currentTicket}, In Regular: ${currentExistsInRegular}, In Transferred: ${currentExistsInTransferred}, isCalling: ${isCalling}, isAccepted: ${isAccepted}`);
        
        // Auto-select logic ONLY for regular tickets
        // Transferred tickets are NEVER auto-selected and NEVER auto-switched
        if (currentExistsInTransferred) {
          // If current ticket is in transferred list, ALWAYS keep it (never auto-switch)
          // Do NOT run any other logic - just keep the ticket as is
          console.log(`✅ Keeping transferred ticket: ${currentTicket} - LOCKED IN`);
          // DO NOT call setCurrentTicket - it will cause re-render and polling will override it
          // The ticket is already set, just leave it alone
        } else if (!currentTicket && tickets.length > 0) {
          // No ticket selected, pick first regular one
          console.log(`🔄 No ticket selected, setting to: ${tickets[0].ticketNumber}`);
          setCurrentTicket(tickets[0].ticketNumber);
        } else if (!currentTicket && tickets.length === 0 && transferred.length > 0) {
          // No regular tickets but have transferred tickets, DON'T auto-select
          console.log(`📋 No regular tickets, but have ${transferred.length} transferred tickets available for manual selection`);
          // Don't clear if user might have selected a transferred ticket
        } else if (!currentExistsInRegular && !currentExistsInTransferred && !isCalling && !isAccepted && tickets.length > 0) {
          // Current ticket gone from BOTH lists and user not working on it, pick first available regular ticket
          console.log(`🔄 Current ticket gone from both lists, switching to: ${tickets[0].ticketNumber}`);
          setCurrentTicket(tickets[0].ticketNumber);
        } else if (!currentExistsInRegular && !currentExistsInTransferred && tickets.length === 0 && transferred.length === 0) {
          // No tickets left in either list
          console.log(`🔄 No tickets available, clearing current`);
          setCurrentTicket('');
        } else if (currentExistsInRegular) {
          console.log(`✅ Keeping current ticket: ${currentTicket} (in regular list)`);
        }
      }
    } catch (error) {
      console.error('[UserDashboard] Error fetching tickets:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTickets();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    // Listen for ticket lock events from other users
    const lockChannel = new BroadcastChannel('ticket-locks');
    lockChannel.onmessage = (event) => {
      const { ticketNumber, locked, userId } = event.data;
      console.log('🔒 Received lock event:', event.data);
      
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // If ticket was locked by another user
      if (locked && userId !== currentUser?.id) {
        // Remove from unassigned tickets and update current ticket
        setUnassignedTickets(prev => {
          const filtered = prev.filter(t => t.ticketNumber !== ticketNumber);
          return filtered;
        });
        
        // Check if current ticket was locked, then switch to next
        setCurrentTicket(prev => {
          if (prev === ticketNumber) {
            // Refresh to get updated list
            fetchAssignedTickets(false);
            return '';
          }
          return prev;
        });
        
        // Update total pending count
        setTotalPending(prev => Math.max(0, prev - 1));
      }
      
      // If ticket was unlocked, refresh the list
      if (!locked) {
        fetchAssignedTickets(false);
      }
    };

    // Listen for ticket transfer events
    const transferChannel = new BroadcastChannel('ticket-transfers');
    transferChannel.onmessage = (event) => {
      const { ticketNumber, transferredTo, transferredBy } = event.data;
      console.log('📥 Received transfer event:', event.data);
      
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // If ticket was transferred to current user, refresh tickets
      if (currentUser && transferredTo === currentUser.username) {
        console.log(`✅ Ticket ${ticketNumber} transferred to me from ${transferredBy}, refreshing...`);
        fetchAssignedTickets(false);
      }
      // If current user transferred the ticket, tickets already refreshed
      else if (currentUser && transferredBy === currentUser.username) {
        console.log(`📤 I transferred ticket ${ticketNumber} to ${transferredTo}`);
      }
    };

    return () => {
      lockChannel.close();
      transferChannel.close();
    };
  }, []);

  const fetchAvailableUsers = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const res = await axios.get(`${apiUrl}/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const users = res.data.users || res.data.data || [];
        console.log('📋 Available users fetched:', users);
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCalledTickets = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      if (!currentUser?.id) return;
      
      // Fetch tickets called by this user today
      const res = await axios.get(`${apiUrl}/user/called-tickets/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setCalledTickets(res.data.tickets || []);
        console.log('📞 Called tickets fetched:', res.data.tickets?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching called tickets:', error);
      setCalledTickets([]);
    }
  };

  const handleShowCalledTickets = () => {
    fetchCalledTickets();
    setShowCalledDrawer(true);
  };

  const loadMoreTickets = () => {
    fetchAssignedTickets(false);
  };

  // Poll to check if current ticket is still available
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchAssignedTickets(false);
    }, 1000); // Check every 1 second

    return () => clearInterval(pollInterval);
  }, [currentTicket, isAccepted, isCalling]); // Include dependencies so polling respects current state

  const handleCall = async () => {
    if (currentTicket && !isCalling) {
      const token = getToken();
      if (!token) return;
      
      setIsCalling(true); // Disable button
      
      try {
        console.log(`🔔 Calling ticket: ${currentTicket}`);
        
        // Call the ticket and save to backend
        const response = await axios.post(
          `${apiUrl}/user/call-ticket`,
          { ticketNumber: currentTicket },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Ticket called successfully:', response.data);
        
        // Prepare ticket data
        const ticketData = {
          ticket: currentTicket,
          counter: response.data.counterNo || '',
          timestamp: new Date().getTime()
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('latest_ticket_call', JSON.stringify(ticketData));
        
        // Broadcast to ticket_info page using BroadcastChannel
        const channel = new BroadcastChannel('ticket-calls');
        channel.postMessage(ticketData);
        console.log('📡 Broadcasted ticket data:', ticketData);
        channel.close();
        
        // DON'T refresh tickets here - keep the called ticket as current
        // User can call it again if needed
        console.log(`✅ Current ticket stays: ${currentTicket}`);
        
      } catch (error) {
        console.error('[UserDashboard] Error calling ticket:', error);
        
        // Handle specific error: No counter assigned
        if (error.response?.data?.no_counter) {
          alert(error.response.data.message);
          // Redirect to login to select counter
          // Don't clear session - just redirect
          router.push('/login');
        } else {
          // Generic error
          alert(`❌ Failed to call ticket: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        // Re-enable button after 2 seconds
        setTimeout(() => setIsCalling(false), 2000);
      }
    }
  };

  const handleNext = () => {
    setShowNextConfirmModal(true);
  };

  const handleNextConfirm = async () => {
    const token = getToken();
    if (!token) return;
    
    setIsNextProcessing(true); // Disable button
    
    try {
      // Update current ticket status to Unattended
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        { status: 'Unattended' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Ticket marked as Unattended');
      
      // Clear current ticket first
      setCurrentTicket('');
      
      // Refresh to get updated list which will auto-select next ticket
      await fetchAssignedTickets(false);
      
      // Auto-close modal after completion
      setShowNextConfirmModal(false);
      setIsNextProcessing(false);
    } catch (error) {
      console.error('Error marking ticket as unattended:', error);
      setShowNextConfirmModal(false);
      setIsNextProcessing(false);
    }
  };

  const handleAccept = async () => {
    console.log('Accept button clicked');
    const token = getToken();
    if (!token) return;
    
    try {
      // Get current user info
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // Lock the ticket to current user
      const response = await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        { 
          lock: true,
          user_id: currentUser?.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Ticket locked successfully');
      
      // Broadcast lock event to other users
      const lockChannel = new BroadcastChannel('ticket-locks');
      lockChannel.postMessage({
        ticketNumber: currentTicket,
        locked: true,
        userId: currentUser?.id
      });
      lockChannel.close();
      
      setIsAccepted(true);
      setTimer(0);
      
      // Start timer
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      
    } catch (error) {
      console.error('Error locking ticket:', error);
      
      // Show error message
      if (error.response?.status === 409) {
        alert('This ticket has already been accepted by another user.');
      } else {
        alert('Failed to accept ticket. Please try again.');
      }
      
      // Refresh tickets to get updated list
      await fetchAssignedTickets(false);
    }
  };

  const handleSolved = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Unlock and update ticket status to Solved
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        { lock: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        { 
          status: 'Solved',
          serviceTimeSeconds: timer // Send timer value in seconds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Ticket marked as Solved and unlocked');
      
      const solvedTicket = currentTicket;
      
      // Broadcast unlock event
      const lockChannel = new BroadcastChannel('ticket-locks');
      lockChannel.postMessage({
        ticketNumber: solvedTicket,
        locked: false
      });
      lockChannel.close();
      
      // Reset state
      setIsAccepted(false);
      setTimer(0);
      setCurrentTicket(''); // Clear current ticket immediately
      
      // Refresh tickets - will automatically show next available ticket
      await fetchAssignedTickets(false);
      
    } catch (error) {
      console.error('Error marking ticket as solved:', error);
    }
  };

  const handleNotSolved = () => {
    setShowReasonModal(true);
  };

  const handleNotSolvedSubmit = async () => {
    const token = getToken();
    if (!token) return;
    
    setIsNotSolvedProcessing(true); // Disable button
    
    try {
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Unlock ticket first
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        { lock: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update ticket status to Not Solved with reason
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        { 
          status: 'Not Solved',
          reason: notSolvedReason,
          serviceTimeSeconds: timer // Send timer value in seconds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Ticket marked as Not Solved and unlocked');
      
      const notSolvedTicket = currentTicket;
      
      // Broadcast unlock event
      const lockChannel = new BroadcastChannel('ticket-locks');
      lockChannel.postMessage({
        ticketNumber: notSolvedTicket,
        locked: false
      });
      lockChannel.close();
      
      // Reset state
      setIsAccepted(false);
      setTimer(0);
      setNotSolvedReason('');
      setCurrentTicket(''); // Clear current ticket immediately
      
      // Refresh tickets - will automatically show next available ticket
      await fetchAssignedTickets(false);
      
      // Auto-close modal after completion
      setShowReasonModal(false);
      setIsNotSolvedProcessing(false);
      
    } catch (error) {
      console.error('Error marking ticket as not solved:', error);
      setIsNotSolvedProcessing(false);
    }
  };

  const handleTransfer = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      // Fetch all users under same admin
      const res = await axios.get(`${apiUrl}/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📋 Available users fetched:', res.data.users || res.data.data || []);
      
      if (res.data.success) {
        setAvailableUsers(res.data.users || res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
    }
    
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async () => {
    const token = getToken();
    if (!token || !transferUsername.trim()) return;
    
    setIsTransferProcessing(true); // Disable button
    
    try {
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Get current user info from localStorage
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      console.log('🔍 Transfer validation:');
      console.log('Current user:', currentUser);
      console.log('Current user username:', currentUser?.username);
      console.log('Available users:', availableUsers);
      console.log('Searching for username:', transferUsername.trim());
      
      if (!currentUser || !currentUser.username) {
        alert('Error: Unable to identify current user. Please refresh and try again.');
        setIsTransferProcessing(false);
        return;
      }
      
      // Check if the target user exists and is under same admin
      const targetUser = availableUsers.find(u => u.username === transferUsername.trim());
      
      console.log('Target user found:', targetUser);
      
      if (!targetUser) {
        alert(`Error: User "${transferUsername}" not found. Please select a valid user from the list.`);
        setIsTransferProcessing(false);
        return;
      }
      
      // Check if both users are under same admin
      if (currentUser?.admin_id && targetUser?.admin_id && currentUser.admin_id !== targetUser.admin_id) {
        alert(`Error: User "${transferUsername}" is not under the same admin. You can only transfer tickets to users within your admin group.`);
        setIsTransferProcessing(false);
        return;
      }
      
      const transferByUsername = currentUser.username;
      console.log('🔄 Transferring ticket:', currentTicket, 'from', transferByUsername, 'to', transferUsername);
      
      // Unlock ticket first
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        { lock: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Transfer ticket to selected user
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/transfer`,
        { 
          transferred_to: transferUsername,
          reason: `Transferred to ${transferUsername}`,
          transfer_by: transferByUsername
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Ticket transferred and unlocked successfully');
      
      const transferredTicket = currentTicket;
      
      // Reset states FIRST before refreshing
      setIsAccepted(false);
      setIsCalling(false);
      setTimer(0);
      setTransferUsername('');
      
      // Clear current ticket so fetchAssignedTickets will pick next one
      setCurrentTicket('');
      
      // Broadcast unlock event
      const lockChannel = new BroadcastChannel('ticket-locks');
      lockChannel.postMessage({
        ticketNumber: transferredTicket,
        locked: false
      });
      lockChannel.close();
      
      // Broadcast transfer event to notify all users
      const transferChannel = new BroadcastChannel('ticket-transfers');
      transferChannel.postMessage({
        ticketNumber: transferredTicket,
        transferredTo: transferUsername,
        transferredBy: currentUser?.username || ''
      });
      transferChannel.close();
      
      console.log(`📤 Transfer event broadcasted: ${transferredTicket} -> ${transferUsername}`);
      
      // Refresh tickets - this will automatically set next available ticket
      await fetchAssignedTickets(false);
      
      // Auto-close modal after completion
      setShowTransferModal(false);
      setIsTransferProcessing(false);
      
      // Show success message after modal is closed
      alert(`Ticket successfully transferred to ${transferUsername}`);
      
    } catch (error) {
      console.error('Error transferring ticket:', error);
      alert('Failed to transfer ticket. Please try again.');
      setIsTransferProcessing(false);
    }
  };

  const handleSelectManual = () => {
    if (!manualTicketId.trim()) {
      alert('Please enter a ticket ID');
      return;
    }

    // Check if user has already accepted a ticket
    if (isAccepted) {
      alert('Please resolve the current ticket first before selecting a new ticket');
      return;
    }

    const searchTicketId = manualTicketId.trim().toUpperCase();
    
    // Search in unassigned tickets
    const foundInUnassigned = unassignedTickets.find(
      t => t.ticketNumber?.toString().toUpperCase() === searchTicketId
    );
    
    // Search in transferred tickets
    const foundInTransferred = transferredTickets.find(
      t => t.ticketNumber?.toString().toUpperCase() === searchTicketId
    );
    
    if (foundInUnassigned) {
      console.log(`✅ Found ticket ${searchTicketId} in unassigned tickets`);
      setCurrentTicket(foundInUnassigned.ticketNumber);
      setManualTicketId('');
      return;
    }
    
    if (foundInTransferred) {
      console.log(`✅ Found ticket ${searchTicketId} in transferred tickets`);
      setCurrentTicket(foundInTransferred.ticketNumber);
      setManualTicketId('');
      return;
    }
    
    // Ticket not found in either list
    alert(`Ticket "${searchTicketId}" not found in your assigned tickets`);
    setManualTicketId('');
  };

  // Format timer to HH:MM:SS
  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="flex ml-2 gap-3 mb-6">
          {/* Load More Tickets Card - Left */}
          <div className="w-45 rounded-lg">
            <button
              onClick={loadMoreTickets}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-base font-medium transition-colors mb-3"
            >
              Load More Tickets
            </button>
            <div className="bg-white rounded-lg shadow-md px-2 py-2 text-center">
              <p className="text-[15px] leading-[22.95px] text-gray-600 text-center">Total Pending Tickets</p>
              <p className="text-2xl font-bold mt-2 text-gray-800">{totalPending}</p>
            </div>
          </div>

          {/* Current Ticket ID Card - Center */}
          <div className="flex-1 bg-white rounded-lg shadow-md py-8 px-6 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <h1 className="text-[38px] font-semibold text-gray-700">
                Current Ticket ID:
              </h1>
              <p className="text-[38px] uppercase font-bold text-gray-900">{currentTicket}</p>
            </div>
          </div>

          {/* Show Called Tickets Button - Right */}
          <div className="flex text-[15px] leading-[22.95px] items-start justify-end width-[180px]">
            <button 
              onClick={handleShowCalledTickets}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2.5 rounded-lg text-base font-medium transition-colors"
            >
              Show Called Tickets
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {!isAccepted ? (
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={handleCall}
              disabled={isCalling}
              className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${
                isCalling 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isCalling ? 'Calling...' : 'Call'}
            </button>
            {showNextButton && (
              <button
                onClick={handleNext}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Next
              </button>
            )}
            <button
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Accept
            </button>
          </div>
        ) : (
          <>
            {/* Timer Display */}
            <div className="flex justify-center mb-6">
              <div className="text-4xl font-bold text-gray-700">
                {formatTimer(timer)}
              </div>
            </div>
            
            {/* Solved, Not Solved, Transfer Buttons */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={handleSolved}
                className="bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Solved
              </button>
              <button
                onClick={handleNotSolved}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Not Solved
              </button>
              {showTransferButton && (
                <button
                  onClick={handleTransfer}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Transfer
                </button>
              )}
            </div>
          </>
        )}

        {/* Manual Ticket Entry */}
        <div className="flex justify-center gap-3 mb-6">
          <input
            type="text"
            value={manualTicketId}
            onChange={(e) => setManualTicketId(e.target.value)}
            placeholder="Enter Manual Ticket ID"
            className="px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-72 bg-white text-base"
          />
          <button
            onClick={handleSelectManual}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg text-base font-medium transition-colors"
          >
            Select
          </button>
        </div>

        {/* Transferred Tickets Table */}
        {transferredTickets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-xl font-semibold text-blue-800">Transferred Tickets</h2>
              <p className="text-sm text-blue-600 mt-1">Click on any ticket to set it as current ticket</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transferred By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transferredTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      onClick={() => {
                        // Only allow selection if no ticket is currently accepted
                        if (isAccepted) {
                          alert('Please complete or cancel the current ticket before selecting a transferred ticket.');
                          return;
                        }

                        // Set current ticket
                        setCurrentTicket(ticket.ticketNumber);
                        console.log(`✅ Transferred ticket ${ticket.ticketNumber} selected - this should persist`);
                      }}
                      className={`cursor-pointer transition-colors ${
                        currentTicket === ticket.ticketNumber 
                          ? 'bg-blue-200 hover:bg-blue-300' 
                          : 'hover:bg-blue-100'
                      }`}
                    >
                      <td className="px-6 py-4 uppercase whitespace-nowrap text-sm font-medium text-blue-900">
                        {ticket.ticketNumber?.toString().toUpperCase()}
                      </td>
                      <td className="px-6 py-4 uppercase whitespace-nowrap text-sm text-gray-900">
                        {ticket.service?.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.transfer_by || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unassigned Tickets Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Unassigned Tickets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unassignedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No pending tickets found for your assigned services.
                    </td>
                  </tr>
                ) : (
                  unassignedTickets.slice(0, visibleTickets).map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 uppercase whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticketNumber?.toString().toUpperCase()}
                      </td>
                      <td className="px-6 py-4 uppercase whitespace-nowrap text-sm text-gray-900">
                        {ticket.service?.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.submissionTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.submissionDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {unassignedTickets.length > visibleTickets && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setVisibleTickets(visibleTickets + 5)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Show More
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Not Solved Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Reason for Not Solved</h3>
            <textarea
              value={notSolvedReason}
              onChange={(e) => setNotSolvedReason(e.target.value)}
              placeholder="Enter reason why ticket was not solved..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
              rows="4"
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setNotSolvedReason('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleNotSolvedSubmit}
                disabled={!notSolvedReason.trim() || isNotSolvedProcessing}
                className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold ${
                  notSolvedReason.trim() && !isNotSolvedProcessing
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isNotSolvedProcessing ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Transfer Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">Select a username to transfer this ticket to:</p>
            <select
              value={transferUsername}
              onChange={(e) => setTransferUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-6 transition-all bg-white text-gray-900"
            >
              <option value="">-- Select User --</option>
              {availableUsers
                .filter(user => {
                  const currentUserStr = localStorage.getItem('user');
                  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
                  // Only show users with role "user" under same admin
                  return user.role === 'user' && 
                         user.admin_id === currentUser?.admin_id && 
                         user.id !== currentUser?.id;
                })
                .map((user) => (
                  <option key={user.id} value={user.username}>
                    {user.username} {user.counter_no ? `(Counter ${user.counter_no})` : ''}
                  </option>
                ))
              }
            </select>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferUsername('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={!transferUsername.trim() || isTransferProcessing}
                className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold ${
                  transferUsername.trim() && !isTransferProcessing
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isTransferProcessing ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Confirmation Modal */}
      {showNextConfirmModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Next</h3>
            <p className="text-base text-gray-600 mb-8">
             Are you sure you want to proceed? This will delete the current ticket.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowNextConfirmModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                No
              </button>
              <button
                onClick={handleNextConfirm}
                disabled={isNextProcessing}
                className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold shadow-lg ${
                  isNextProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
                }`}
              >
                {isNextProcessing ? 'Processing...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Called Tickets Drawer */}
      {showCalledDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-opacity-50  z-40 transition-opacity"
            onClick={() => setShowCalledDrawer(false)}
          />
          
          {/* Drawer - Right to Left */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <h2 className="text-xl font-bold text-green-800">Called Tickets Today</h2>
              <button
                onClick={() => setShowCalledDrawer(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100%-73px)] p-6">
              {calledTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg font-medium">No tickets called today</p>
                  <p className="text-sm mt-2">Start calling tickets to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calledTickets.map((ticket, index) => (
                    <div 
                      key={ticket.ticket_id || index}
                      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-green-700">
                              {ticket.ticket_number}
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Counter {ticket.counter_no || 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Service:</span> {ticket.service_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Called at:</span> {ticket.call_time ? new Date(ticket.call_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {ticket.status && (
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            ticket.status === 'Solved' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'Not Solved' ? 'bg-red-100 text-red-700' :
                            ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
