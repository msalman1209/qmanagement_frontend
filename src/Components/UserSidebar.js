'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { HiDocumentText } from 'react-icons/hi';

export default function UserSidebar() {
  const pathname = usePathname();
  const [username, setUsername] = useState('User');
  const [counter, setCounter] = useState('-');
  const [permissions, setPermissions] = useState(null);
  const [userRole, setUserRole] = useState('user');

  // Function to refresh user data from localStorage
  const refreshUserData = () => {
    const userStr = localStorage.getItem('user');
    console.log('🔄 [UserSidebar] Refreshing user data from localStorage');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        setUsername(user.username || 'User');
        setCounter(user.counter_no || user.counterNo || '-');
        setUserRole(user.role || 'user');
        
        // Parse permissions
        let userPermissions = user.permissions;
        
        if (typeof userPermissions === 'string') {
          try {
            userPermissions = JSON.parse(userPermissions);
          } catch (e) {
            console.error('❌ [UserSidebar] Failed to parse permissions:', e);
            userPermissions = null;
          }
        }
        
        setPermissions(userPermissions);
        console.log('✅ [UserSidebar] Permissions refreshed:', userPermissions);
      } catch (error) {
        console.error('❌ [UserSidebar] Error parsing user data:', error);
      }
    }
  };

  useEffect(() => {
    // Initial load
    refreshUserData();
    
    // 🔄 Auto-refresh every 5 seconds to pick up permission changes (faster for testing)
    const refreshInterval = setInterval(() => {
      refreshUserData();
    }, 5000); // 5 seconds for faster updates

    // 📡 Listen for custom storage events (when permissions update)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === null) {
        console.log('🔔 [UserSidebar] Storage changed - refreshing permissions');
        refreshUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isActive = (path) => pathname === path;
  
  // Check if user has specific permission
  const hasPermission = (permission) => {
    // Admin and super_admin have all permissions
    if (userRole === 'admin' || userRole === 'super_admin') {
      console.log(`✅ [hasPermission] ${permission}: Admin bypass = true`);
      return true;
    }
    
    const result = permissions && permissions[permission] === true;
    console.log(`🔐 [hasPermission] ${permission}:`, {
      permissionsExist: !!permissions,
      permissionValue: permissions?.[permission],
      result: result
    });
    
    return result;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col overflow-y-auto">
      {/* User Info */}
      <div className="px-4 py-6 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-normal">User: </span>
          <span className="font-semibold text-gray-800">{username}</span>
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-normal">Counter: </span>
          <span className="font-semibold text-gray-800">{counter}</span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        <div className="px-4 mb-2 pb-2 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">MISC</p>
        </div>

        {/* User Dashboard - Only show if user has canCallTickets permission */}
        {hasPermission('canCallTickets') && (
          <Link
            href="/user/dashboard"
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              isActive('/user/dashboard') || pathname?.includes('/dashboard')
                ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MdDashboard className="text-base" />
            <span className="text-sm font-normal">User Dashboard</span>
          </Link>
        )}

        {/* Completed Tasks - Only show if user has canCreateTickets permission */}
        {hasPermission('canCreateTickets') && (
          <Link
            href="/user/completed-tasks"
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              isActive('/user/completed-tasks') || pathname?.includes('/completed-tasks')
                ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiDocumentText className="text-base" />
            <span className="text-sm font-normal">Completed Tasks</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}
