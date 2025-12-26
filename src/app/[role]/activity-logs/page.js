'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getToken } from '@/utils/sessionStorage';




export default function ActivityLogsPage({ adminId }) {
  console.log('🔍 [ActivityLogsPage] Rendering with adminId:', adminId);
  const token = useSelector((state) => state.auth.token);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    activityType: 'all',
    userRole: 'all',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [adminId, filters.page, filters.activityType, filters.userRole]);

  const fetchLogs = async () => {
    if (!adminId) {
      console.error('❌ [fetchLogs] adminId is missing!', { adminId });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const authToken = token || getToken();
      console.log('📋 [fetchLogs] Admin ID:', adminId, 'Token:', authToken ? 'exists' : 'missing');
      
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.activityType !== 'all' && { activityType: filters.activityType }),
        ...(filters.userRole !== 'all' && { userRole: filters.userRole }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity-logs/admin/${adminId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      console.log('📋 [fetchLogs] Response status:', response.status);
      const data = await response.json();
      console.log('📋 [fetchLogs] Response data:', data);
      
      if (!response.ok) {
        console.error('❌ [fetchLogs] API error:', response.status, data);
      }
      
      if (data.success) {
        console.log('✅ [fetchLogs] Logs received:', data.data?.logs?.length || 0);
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      } else {
        console.error('❌ [fetchLogs] API returned success=false:', data.message);
      }
    } catch (error) {
      console.error('❌ [fetchLogs] Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!adminId) {
      console.error('❌ [fetchStats] adminId is missing!', { adminId });
      return;
    }
    
    try {
      const authToken = token || getToken();
      
      const queryParams = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity-logs/admin/${adminId}/stats?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      console.log('📊 [fetchStats] Response status:', response.status);
      const data = await response.json();
      console.log('📊 [fetchStats] Response data:', data);
      
      if (data.success) {
        console.log('✅ [fetchStats] Stats received');
        setStats(data.data);
      } else {
        console.error('❌ [fetchStats] API returned success=false:', data.message);
      }
    } catch (error) {
      console.error('❌ [fetchStats] Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const getActivityIcon = (type) => {
    const icons = {
      'TICKET_CREATED': '🎫',
      'TICKET_CALLED': '📢',
      'TICKET_COMPLETED': '✅',
      'SERVICE_CREATED': '➕',
      'SERVICE_UPDATED': '✏️',
      'SERVICE_DELETED': '🗑️',
      'USER_CREATED': '👤',
      'USER_UPDATED': '👥',
      'USER_DELETED': '❌',
      'COUNTER_ASSIGNED': '🔢',
      'SETTINGS_CHANGED': '⚙️',
      'LOGIN': '🔐',
      'LOGOUT': '🚪',
      'PASSWORD_CHANGED': '🔑',
      'ROLE_CHANGED': '🎭',
      'SUPER_ADMIN_ACTION': '⭐'
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colors = {
      'TICKET_CREATED': 'bg-blue-100 text-blue-800',
      'TICKET_CALLED': 'bg-purple-100 text-purple-800',
      'TICKET_COMPLETED': 'bg-green-100 text-green-800',
      'SERVICE_CREATED': 'bg-teal-100 text-teal-800',
      'SERVICE_UPDATED': 'bg-yellow-100 text-yellow-800',
      'SERVICE_DELETED': 'bg-red-100 text-red-800',
      'USER_CREATED': 'bg-indigo-100 text-indigo-800',
      'USER_UPDATED': 'bg-orange-100 text-orange-800',
      'USER_DELETED': 'bg-red-100 text-red-800',
      'COUNTER_ASSIGNED': 'bg-cyan-100 text-cyan-800',
      'SETTINGS_CHANGED': 'bg-gray-100 text-gray-800',
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'PASSWORD_CHANGED': 'bg-pink-100 text-pink-800',
      'ROLE_CHANGED': 'bg-purple-100 text-purple-800',
      'SUPER_ADMIN_ACTION': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'admin': 'bg-blue-100 text-blue-800',
      'receptionist': 'bg-green-100 text-green-800',
      'user': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Format timestamp to YYYY-MM-DD HH:MM:SS
  const formatTime = (dateString) => {
    if (!dateString || dateString === '0000-00-00 00:00:00') return '-';
    
    try {
      // Check if it's ISO format (2025-12-16T06:34:54.000Z)
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      // MySQL format is already: "2025-12-03 11:03:50" - just return as-is
      return dateString.trim();
    } catch (e) {
      return dateString;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Activity Logs</h1>
            <p className="text-gray-600">Track all activities and changes made by users</p>
          </div>
          <div className="text-right text-sm text-gray-500">

          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.activityCounts.reduce((sum, ac) => sum + ac.count, 0)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeUsers.length}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activity Types</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activityCounts.length}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Roles</p>
                <p className="text-2xl font-bold text-gray-800">{stats.roleCounts.length}</p>
              </div>
              <div className="text-3xl">🎭</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <select
              value={filters.activityType}
              onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="TICKET_CREATED">Ticket Created</option>
              <option value="TICKET_CALLED">Ticket Called</option>
              <option value="TICKET_COMPLETED">Ticket Completed</option>
              <option value="SERVICE_CREATED">Service Created</option>
              <option value="SERVICE_UPDATED">Service Updated</option>
              <option value="SERVICE_DELETED">Service Deleted</option>
              <option value="USER_CREATED">User Created</option>
              <option value="SETTINGS_CHANGED">Settings Changed</option>
              <option value="SUPER_ADMIN_ACTION">Super Admin Action</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
            <select
              value={filters.userRole}
              onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({
                activityType: 'all',
                userRole: 'all',
                search: '',
                startDate: '',
                endDate: '',
                page: 1,
                limit: 20
              });
              fetchLogs();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Activity Timeline</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No activity logs found</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getActivityColor(log.activity_type)}`}>
                    {getActivityIcon(log.activity_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(log.activity_type)}`}>
                        {log.activity_type.replace(/_/g, ' ')}
                      </span>
                      {log.user_role && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(log.user_role)}`}>
                          {log.user_role.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {log.activity_description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {log.username && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {log.username}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(log.created_at)}
                      </span>
                      {log.ip_address && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          {log.ip_address}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    {log.metadata && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-gray-500">{key}:</span>
                            <span className="text-gray-700">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 border rounded-lg bg-green-50 text-green-700 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
