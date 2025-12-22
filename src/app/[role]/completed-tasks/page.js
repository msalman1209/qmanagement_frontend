'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import { getToken, getUser } from '@/utils/sessionStorage';

export default function CompletedTasks() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noPermissions, setNoPermissions] = useState(false); // New state for no-permissions error

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
        
        // Check if permissions changed - if canCreateTickets removed, redirect
        if (!freshUser.permissions.canCreateTickets) {
          alert('⚠️ Your permissions have been updated. Completed Tasks access has been removed.');
          if (freshUser.permissions.canCallTickets) {
            router.push('/user/dashboard');
          } else {
            router.push('/login');
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh permissions:', error);
    }
  };

  // ✅ Check permissions on mount + auto-refresh every 30 seconds
  useEffect(() => {
    const checkPermissions = () => {
      const token = getToken();
      const user = getUser();
      
      if (!token || !user) {
        console.error('❌ No token or user found - redirecting to login');
        router.push('/login');
        return false;
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

      // Check if user has canCreateTickets permission
      if (user.role !== 'admin' && user.role !== 'super_admin' && (!permissions || !permissions.canCreateTickets)) {
        console.warn('⚠️ User does not have canCreateTickets permission');
        
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
          setNoPermissions(true); // Set flag to show error UI
          // Don't redirect, just return - will show error in UI
          return false;
        }
        
        // Has other permissions but not canCreateTickets
        alert('You do not have permission to access completed tasks. You need "Completed Task" permission.');
        
        // Check if user has call tickets permission and redirect there
        if (permissions && permissions.canCallTickets) {
          router.push('/user/dashboard');
        } else {
          router.push('/login');
        }
        return false;
      }

      console.log('✅ User has canCreateTickets permission');
      return true;
    };

    if (checkPermissions()) {
      // Only fetch tickets if user has permission
      fetchCompletedTickets();
    }
    
    // 🔄 Auto-refresh permissions every 5 seconds (faster for immediate updates)
    const permissionRefreshInterval = setInterval(() => {
      refreshUserPermissions();
    }, 5000); // 5 seconds

    return () => {
      clearInterval(permissionRefreshInterval);
    };
  }, [router]);

  // Fetch completed tickets
  const fetchCompletedTickets = async (filterStartDate = '', filterEndDate = '') => {
    const token = getToken();
    console.log('🔐 Token check:', token ? '✅ Token exists' : '❌ No token');
    
    if (!token) {
      console.log('❌ No token - redirecting to login');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url = `${apiUrl}/user/tickets/completed`;
      
      // Add query parameters for date filtering
      const params = new URLSearchParams();
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('📡 Fetching from:', url);
      console.log('🎫 Headers being sent:', { Authorization: `Bearer ${token.substring(0, 20)}...` });

      const response = await axios.get(url);

      console.log('✅ Response received:', response.status);
      console.log('📦 Response data:', response.data);

      if (response.data.success) {
        const tickets = response.data.tickets || [];
        console.log(`✅ Setting ${tickets.length} completed tickets to state`);
        setCompletedTasks(tickets);
        console.log(`✅ Loaded ${tickets.length} completed tickets`);
        if (tickets.length > 0) {
          console.log('📊 First ticket:', tickets[0]);
          console.log('📊 Last ticket:', tickets[tickets.length - 1]);
        } else {
          console.log('⚠️ No tickets in response');
        }
      } else {
        console.log('❌ Response success=false:', response.data);
        setError('Failed to load tickets');
      }
    } catch (err) {
      console.error('❌ Error fetching tickets:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method
        }
      });
      
      // Check if error is due to missing permission
      if (err.response?.status === 403 && err.response?.data?.missing_permission) {
        console.error('⚠️ Permission denied - redirecting to dashboard');
        alert(err.response.data.message || 'You do not have permission to view completed tasks');
        const user = getUser();
        let permissions = user?.permissions;
        if (typeof permissions === 'string') {
          try { permissions = JSON.parse(permissions); } catch (e) { permissions = null; }
        }
        if (permissions?.canCallTickets) {
          router.push('/user/dashboard');
        } else {
          router.push('/login');
        }
        return;
      }
      
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load completed tickets';
      console.error('Setting error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  // Handle filter button click
  const handleFilter = () => {
    fetchCompletedTickets(startDate, endDate);
  };

  // Handle reset filter
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchCompletedTickets('', '');
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch(statusLower) {
      case 'solved':
        return 'bg-green-500 text-white';
      case 'not_solved':
      case 'not solved':
        return 'bg-red-500 text-white';
      case 'unattended':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-blue-500 text-white';
      case 'called':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'N/A';
    return status.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime || dateTime === '0000-00-00 00:00:00') return 'N/A';
    try {
      return new Date(dateTime).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

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
            <h1 className="text-3xl font-semibold text-gray-700 mb-6">Completed Tickets</h1>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={handleFilter}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Filter'}
            </button>
            <button 
              onClick={handleReset}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {!loading && !error && (
            <div className="mt-4 text-gray-600">
              Total Tickets: <span className="font-semibold text-gray-800">{completedTasks.length}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-600">Loading tickets...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && completedTasks.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-600">No completed tickets found</div>
          </div>
        )}

        {/* Completed Tasks Table */}
        {!loading && !error && completedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Created Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      T.#
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Update Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Called Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Called Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solved By C.#
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(task.ticketCreatedTime)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.ticketNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.service}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {task?.serviceTime || "00:00:00"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(task.statusUpdateTime)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {task.calledCount || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(task.calledTime)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.transferInfo || 'Not Transferred'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {task.transferInfo && task.transferInfo !== 'Not Transferred' 
                          ? formatDateTime(task.transferTime) 
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-4 py-2 rounded font-medium ${getStatusColor(task.status)}`}>
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {task.solvedBy || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
