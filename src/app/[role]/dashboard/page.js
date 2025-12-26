'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import { getToken, getUser } from '@/utils/sessionStorage';



export default function UserDashboard({ adminId = null }) {
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
  const [noPermissions, setNoPermissions] = useState(false); // Track if user has no permissions

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Super Admin mode - when adminId is provided
  const isSuperAdminMode = adminId !== null;
  
  console.log('🔵 Dashboard mode:', isSuperAdminMode ? `Super Admin viewing Admin ${adminId}` : 'Normal User Mode');
  
  console.log('🔵 Dashboard states:', { 
    currentTicket, 
    unassignedCount: unassignedTickets.length, 
    transferredCount: transferredTickets.length,
    userCounter 
  });

  // 🔄 Fetch fresh permissions from backend and update localStorage
  const refreshUserPermissions = async () => {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) return;

    try {
      // Fetch fresh user data from backend
      const response = await axios.get(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const freshUser = response.data.user || response.data;
      
      // Update localStorage with fresh permissions
      if (freshUser && freshUser.permissions) {
        const updatedUser = { ...user, permissions: freshUser.permissions };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // 📡 Trigger storage event for other components to update
        window.dispatchEvent(new Event('storage'));
        
        console.log('✅ [refreshUserPermissions] Updated permissions in localStorage:', freshUser.permissions);
        
        // Check if permissions changed - if canCallTickets removed, set noPermissions
        if (!freshUser.permissions.canCallTickets) {
          console.warn('⚠️ canCallTickets removed - disabling dashboard');
          setNoPermissions(true);
        } else {
          console.log('✅ canCallTickets still active - enabling dashboard');
          setNoPermissions(false);
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh permissions:', error);
    }
  };

  // ✅ Check permissions on mount + auto-refresh every 30 seconds
  useEffect(() => {
    const checkPermissions = async () => {
      const token = getToken();
      const user = getUser();
      
      if (!token || !user) {
        console.error('❌ No token or user found - redirecting to login');
        router.push('/login');
        return;
      }

      // Parse user permissions
      let permissions = user.permissions;
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          console.error('Failed to parse permissions:', e);
          permissions = null;
        }
      }

      // Check if user has canCallTickets permission
      if (user.role !== 'admin' && user.role !== 'super_admin' && (!permissions || !permissions.canCallTickets)) {
        console.warn('⚠️ User does not have canCallTickets permission');
        
        // SET NO PERMISSIONS FLAG - This will disable all buttons and show error UI
        setNoPermissions(true);
        
        // Check if user has ANY permission at all
        const hasAnyPermission = permissions && (
          permissions.canCreateTickets || 
          permissions.canCallTickets ||
          permissions.canAccessDashboard ||
          permissions.canManageUsers ||
          permissions.canManageTickets ||
          permissions.canManageQueue ||
          permissions.canViewReports ||
          permissions.canManageSettings ||
          permissions.canManageCounters ||
          permissions.canManageServices
        );

        if (!hasAnyPermission) {
          // No permissions at all - show error message on page
          alert('❌ You do not have any permissions assigned. Please contact your administrator.');
          // Don't redirect, just return - will show error in UI
          return;
        }
        
        // Has other permissions but not canCallTickets - DON'T REDIRECT, just show disabled UI
        console.log('⚠️ Dashboard access disabled - canCallTickets is false');
        return;
      }

      // User has canCallTickets permission - ensure noPermissions is false
      setNoPermissions(false);
      console.log('✅ User has canCallTickets permission');
    };

    checkPermissions();
    
    // 🔄 Auto-refresh permissions every 5 seconds (faster for immediate updates)
    const permissionRefreshInterval = setInterval(() => {
      refreshUserPermissions();
    }, 5000); // 5 seconds

    return () => {
      clearInterval(permissionRefreshInterval);
    };
  }, [router]);

  // ✅ Check counter on mount - CRITICAL for ticket calling (Skip in Super Admin mode)
  useEffect(() => {
    const checkUserCounter = async () => {
      // Skip counter check in Super Admin mode
      if (isSuperAdminMode) {
        console.log('🔵 Super Admin mode - skipping counter check');
        setUserCounter('SUPER_ADMIN'); // Set dummy counter for Super Admin
        return;
      }
      
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
  }, [router, apiUrl, isSuperAdminMode]);

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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    try {
      if (showLoader) setLoading(true);
      
      // Super Admin mode - fetch tickets for specific admin
      const endpoint = isSuperAdminMode 
        ? `${apiUrl}/user/tickets/assigned?status=Pending&adminId=${adminId}`
        : `${apiUrl}/user/tickets/assigned?status=Pending`;
      
      const res = await axios.get(endpoint, {
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
        console.log(`📊 Current: "${currentTicket}", In Regular: ${currentExistsInRegular}, In Transferred: ${currentExistsInTransferred}, isCalling: ${isCalling}, isAccepted: ${isAccepted}`);
        
        // Auto-select logic ONLY for regular tickets
        // Transferred tickets are NEVER auto-selected and NEVER auto-switched
        if (currentExistsInTransferred) {
          // If current ticket is in transferred list, ALWAYS keep it (never auto-switch)
          console.log(`✅ Keeping transferred ticket: ${currentTicket} - LOCKED IN`);
        } else if (!currentTicket && tickets.length > 0) {
          // No ticket selected, pick first regular one
          console.log(`🔄 No ticket selected, auto-selecting first: ${tickets[0].ticketNumber}`);
          setCurrentTicket(tickets[0].ticketNumber);
        } else if (!currentTicket && tickets.length === 0 && transferred.length > 0) {
          // No regular tickets but have transferred tickets, DON'T auto-select
          console.log(`📋 No regular tickets, but have ${transferred.length} transferred tickets available for manual selection`);
        } else if (currentTicket && !currentExistsInRegular && !currentExistsInTransferred) {
          // Current ticket exists but NOT in either list anymore - someone else called it or it was solved
          console.log(`❌ Current ticket "${currentTicket}" NOT FOUND in any list - removing from display`);
          
          if (!isCalling && !isAccepted) {
            // User not working on it - switch to next ticket or clear
            if (tickets.length > 0) {
              console.log(`🔄 Switching to next available ticket: ${tickets[0].ticketNumber}`);
              setCurrentTicket(tickets[0].ticketNumber);
            } else if (transferred.length > 0) {
              console.log(`📋 No regular tickets, clearing current (${transferred.length} transferred available)`);
              setCurrentTicket('');
            } else {
              console.log(`🔄 No tickets available, clearing current`);
              setCurrentTicket('');
            }
          } else {
            // User is calling or accepted - keep it temporarily but show warning
            console.log(`⚠️ Current ticket "${currentTicket}" not in lists but user is working on it - keeping temporarily`);
          }
        } else if (currentExistsInRegular) {
          console.log(`✅ Keeping current ticket: ${currentTicket} (in regular list)`);
        } else if (!currentTicket) {
          // No current ticket and no auto-selection happened
          console.log(`📭 No current ticket set`);
        }
      }
    } catch (error) {
      console.error('[UserDashboard] Error fetching tickets:', error);
      
      // Check if error is due to missing permission
      if (error.response?.status === 403 && error.response?.data?.missing_permission) {
        console.error('⚠️ Permission denied - redirecting to completed tasks');
        alert(error.response.data.message || 'You do not have permission to access the dashboard');
        const user = getUser();
        let permissions = user?.permissions;
        if (typeof permissions === 'string') {
          try { permissions = JSON.parse(permissions); } catch (e) { permissions = null; }
        }
        if (permissions?.canCreateTickets) {
          router.push('/user/completed-tasks');
        } else {
          router.push('/login');
        }
        return;
      }
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

    // Listen for ticket call events
    const callChannel = new BroadcastChannel('ticket-calls');
    callChannel.onmessage = (event) => {
      const { ticket, counter, caller } = event.data;
      console.log('📞 Received call event:', event.data);
      
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // If someone else called a ticket, remove it from my list
      if (currentUser && caller && caller !== currentUser.username) {
        console.log(`🔔 User ${caller} called ticket ${ticket} - removing from my list`);
        
        // Remove from unassigned tickets
        setUnassignedTickets(prev => {
          const filtered = prev.filter(t => t.ticketNumber !== ticket);
          console.log(`📋 Removed ${ticket}, remaining: ${filtered.length}`);
          return filtered;
        });
        
        // Update total count
        setTotalPending(prev => Math.max(0, prev - 1));
        
        // Check if this was my current ticket using callback
        setCurrentTicket(prev => {
          if (prev === ticket) {
            console.log(`⚠️ My current ticket ${ticket} was called by ${caller} - clearing`);
            // Refresh after state update
            setTimeout(() => {
              fetchAssignedTickets(false);
            }, 100);
            return ''; // Clear current ticket
          }
          return prev; // Keep current ticket if different
        });
      }
    };

    return () => {
      lockChannel.close();
      transferChannel.close();
      callChannel.close();
    };
  }, []);

  const fetchAvailableUsers = async () => {
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    try {
      // Super Admin mode - fetch users for specific admin
      const endpoint = isSuperAdminMode 
        ? `${apiUrl}/user/all?adminId=${adminId}`
        : `${apiUrl}/user/all`;
      
      const res = await axios.get(endpoint, {
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      if (!currentUser?.id && !isSuperAdminMode) return;
      
      // Fetch tickets called by this user today
      const endpoint = isSuperAdminMode
        ? `${apiUrl}/user/called-tickets/today?adminId=${adminId}`
        : `${apiUrl}/user/called-tickets/today`;
      
      const res = await axios.get(endpoint, {
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    fetchCalledTickets();
    setShowCalledDrawer(true);
  };

  const loadMoreTickets = () => {
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    if (currentTicket && !isCalling) {
      const token = getToken();
      if (!token) return;
      
      setIsCalling(true); // Disable button
      
      try {
        console.log(`🔔 Calling ticket: ${currentTicket}${isSuperAdminMode ? ` (Super Admin for Admin ${adminId})` : ''}`);
        
        // Call the ticket and save to backend
        const requestBody = isSuperAdminMode 
          ? { ticketNumber: currentTicket, adminId: adminId, isSuperAdmin: true }
          : { ticketNumber: currentTicket };
        
        const response = await axios.post(
          `${apiUrl}/user/call-ticket`,
          requestBody,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Ticket called successfully:', response.data);
        
        // Prepare ticket data for broadcast
        // In Super Admin mode, extract counter from ticket number or use response
        let counterNumber = response.data.counterNo;
        
        // If no counter from backend, extract from ticket number (e.g., G-2 → counter is "G")
        if (!counterNumber || counterNumber === 'ADMIN_PANEL') {
          const ticketPrefix = currentTicket.split('-')[0];
          counterNumber = ticketPrefix || 'Counter 1';
        }
        
        // Get admin ID from response (for Super Admin mode)
        const broadcastAdminId = response.data.adminId || adminId || null;
        
        // Get current user info
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        console.log('🎯 Counter for broadcast:', counterNumber);
        console.log('🎫 Ticket number:', currentTicket);
        console.log('🏢 Admin ID for broadcast:', broadcastAdminId);
        console.log('👤 Caller:', currentUser?.username);
        
        const ticketData = {
          ticket: currentTicket,
          counter: counterNumber,
          adminId: broadcastAdminId,
          caller: currentUser?.username || 'Unknown',
          timestamp: new Date().getTime()
        };
        
        console.log('📡 Broadcasting ticket data:', ticketData);
        console.log('📡 Ticket:', ticketData.ticket);
        console.log('📡 Counter:', ticketData.counter);
        console.log('📡 Admin ID:', ticketData.adminId);
        console.log('📡 Caller:', ticketData.caller);
        console.log('📡 Timestamp:', ticketData.timestamp);
        
        // Save to localStorage for persistence
        localStorage.setItem('latest_ticket_call', JSON.stringify(ticketData));
        console.log('💾 Saved to localStorage');
        
        // Broadcast to ticket_info page using BroadcastChannel
        const channel = new BroadcastChannel('ticket-calls');
        channel.postMessage(ticketData);
        console.log('✅ Ticket broadcasted to displays via BroadcastChannel');
        channel.close();
        
        // DON'T refresh tickets here - keep the called ticket as current
        // User can call it again if needed
        console.log(`✅ Current ticket stays: ${currentTicket}`);
        
      } catch (error) {
        console.error('[UserDashboard] Error calling ticket:', error);
        
        // Handle specific error: No counter assigned - BUT SKIP IN SUPER ADMIN MODE
        if (error.response?.data?.no_counter && !isSuperAdminMode) {
          alert(error.response.data.message);
          // Redirect to login to select counter
          // Don't clear session - just redirect
          router.push('/login');
        } else if (error.response?.data?.no_counter && isSuperAdminMode) {
          // In Super Admin mode, ignore counter requirement
          console.warn('⚠️ Counter check bypassed in Super Admin mode');
          alert('Note: Counter validation skipped in Super Admin mode. Ticket called successfully.');
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    setShowNextConfirmModal(true);
  };

  const handleNextConfirm = async () => {
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    setIsNextProcessing(true); // Disable button
    
    try {
      // Update current ticket status to Unattended
      const requestBody = isSuperAdminMode
        ? { status: 'Unattended', adminId: adminId }
        : { status: 'Unattended' };
      
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        requestBody,
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    console.log('Accept button clicked');
    const token = getToken();
    if (!token) return;
    
    try {
      // Get current user info
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // Lock the ticket to current user
      const requestBody = isSuperAdminMode
        ? { lock: true, user_id: currentUser?.id, adminId: adminId }
        : { lock: true, user_id: currentUser?.id };
      
      const response = await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        requestBody,
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    try {
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Unlock and update ticket status to Solved
      const unlockBody = isSuperAdminMode ? { lock: false, adminId: adminId } : { lock: false };
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        unlockBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updateBody = isSuperAdminMode 
        ? { status: 'Solved', serviceTimeSeconds: timer, adminId: adminId }
        : { status: 'Solved', serviceTimeSeconds: timer };
      
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        updateBody,
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    setShowReasonModal(true);
  };

  const handleNotSolvedSubmit = async () => {
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
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
      const unlockBody = isSuperAdminMode ? { lock: false, adminId: adminId } : { lock: false };
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        unlockBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update ticket status to Not Solved with reason
      const updateBody = isSuperAdminMode
        ? { status: 'Not Solved', reason: notSolvedReason, serviceTimeSeconds: timer, adminId: adminId }
        : { status: 'Not Solved', reason: notSolvedReason, serviceTimeSeconds: timer };
      
      await axios.put(
        `${apiUrl}/tickets/${currentTicket}`,
        updateBody,
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
    const token = getToken();
    if (!token) return;
    
    try {
      // Fetch all users under same admin
      const endpoint = isSuperAdminMode
        ? `${apiUrl}/user/all?adminId=${adminId}`
        : `${apiUrl}/user/all`;
      
      const res = await axios.get(endpoint, {
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
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
      const unlockBody = isSuperAdminMode ? { lock: false, adminId: adminId } : { lock: false };
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/lock`,
        unlockBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Transfer ticket to selected user
      const transferBody = isSuperAdminMode
        ? { transferred_to: transferUsername, reason: `Transferred to ${transferUsername}`, transfer_by: transferByUsername, adminId: adminId }
        : { transferred_to: transferUsername, reason: `Transferred to ${transferUsername}`, transfer_by: transferByUsername };
      
      await axios.post(
        `${apiUrl}/tickets/${currentTicket}/transfer`,
        transferBody,
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
    if (noPermissions && !isSuperAdminMode) return; // Block if no permissions (but allow in Super Admin mode)
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

  // Fresh Ticket - Only for Super Admin
  const handleFreshTicket = async () => {
    if (!isSuperAdminMode) return; // Only Super Admin can fresh tickets
    
    if (!currentTicket) {
      alert('No ticket selected to fresh');
      return;
    }

    if (!confirm(`Are you sure you want to fresh ticket ${currentTicket}?\n\nThis will reset the ticket to pending status.`)) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      console.log(`🔄 Freshing ticket: ${currentTicket}`);
      
      const response = await axios.post(
        `${apiUrl}/tickets/${currentTicket}/fresh`,
        { adminId: adminId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log('✅ Ticket freshed successfully');
        alert('Ticket freshed successfully!');
        
        // Reset states
        setIsAccepted(false);
        setIsCalling(false);
        setTimer(0);
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        
        // Refresh tickets list
        await fetchAssignedTickets(false);
      }
    } catch (error) {
      console.error('Error freshing ticket:', error);
      alert(`Failed to fresh ticket: ${error.response?.data?.message || error.message}`);
    }
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
        {/* No Permissions Error UI */}
        {noPermissions ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 max-w-md text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-3">No Permissions Assigned</h2>
              <p className="text-gray-700 text-base mb-6">
                You do not have any permissions assigned to your account. Please contact your administrator to grant you the necessary permissions.
              </p>
              <div className="bg-white border border-red-200 rounded p-4 text-sm text-gray-600">
                <p className="font-medium text-red-700 mb-2">Need Help?</p>
                <p>Contact your system administrator to request access permissions.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Section */}
            <div className="flex ml-2 gap-3 mb-6">
              {/* Load More Tickets Card - Left */}
              <div className="w-45 rounded-lg">
                <button
                  onClick={loadMoreTickets}
                  disabled={noPermissions}
                  className={`w-full px-6 py-2.5 rounded-lg text-base font-medium transition-colors mb-3 ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
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
                  disabled={noPermissions}
                  className={`px-8 py-2.5 rounded-lg text-base font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
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
              disabled={isCalling || noPermissions}
              className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${
                isCalling || noPermissions
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isCalling ? 'Calling...' : 'Call'}
            </button>
            {showNextButton && (
              <button
                onClick={handleNext}
                disabled={noPermissions}
                className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                Next
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={noPermissions}
              className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              Accept
            </button>
            {/* Fresh Ticket Button - Only for Super Admin */}
            {isSuperAdminMode && currentTicket && (
              <button
                onClick={handleFreshTicket}
                className="px-10 py-3 rounded-lg text-lg font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
              >
                Fresh Ticket
              </button>
            )}
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
                disabled={noPermissions}
                className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                Solved
              </button>
              <button
                onClick={handleNotSolved}
                disabled={noPermissions}
                className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                Not Solved
              </button>
              {showTransferButton && (
                <button
                  onClick={handleTransfer}
                  disabled={noPermissions}
                  className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                >
                  Transfer
                </button>
              )}
              {/* Fresh Ticket Button - Only for Super Admin */}
              {isSuperAdminMode && (
                <button
                  onClick={handleFreshTicket}
                  className="px-10 py-3 rounded-lg text-lg font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Fresh Ticket
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
            onChange={(e) => !noPermissions && setManualTicketId(e.target.value)}
            placeholder="Enter Manual Ticket ID"
            disabled={noPermissions}
            className={`px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-72 text-base ${noPermissions ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          />
          <button
            onClick={handleSelectManual}
            disabled={noPermissions}
            className={`px-10 py-3 rounded-lg text-base font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
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
                onClick={() => !noPermissions && setVisibleTickets(visibleTickets + 5)}
                disabled={noPermissions}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${noPermissions ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                Show More
              </button>
            </div>
          )}
        </div>

        {/* Not Solved Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
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
      </>
      )}
      </div>
    </div>
  );
}
