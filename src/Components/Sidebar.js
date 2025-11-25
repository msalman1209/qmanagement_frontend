'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { FaUser, FaBell, FaTv, FaSignOutAlt } from 'react-icons/fa';
import { MdSettings, MdDashboard } from 'react-icons/md';
import { HiDocumentReport } from 'react-icons/hi';
import { FaUsers } from 'react-icons/fa6';
import { IoChevronForward } from 'react-icons/io5';

export default function Sidebar() {
  const pathname = usePathname();
  const currentUser = useSelector(selectCurrentUser);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  // Extract role from pathname instead of using state
  const role = pathname.split('/')[1] || 'admin';
  
  // Check if user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const isActive = (path) => pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col overflow-y-auto">
      {/* Navigation */}
      <nav className="flex-1 py-4 ml-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">MISC</p>
        </div>

        {/* Profile - Dynamic Route Support */}
        {/* <Link
          href={`/${role}/profile`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/profile') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <FaUser className="text-lg" />
          <span className="text-sm font-medium">Profile</span>
        </Link> */}

        {/* Services */}
        <div>
          <button
            onClick={() => setIsServicesOpen(!isServicesOpen)}
            className={`flex items-center justify-between w-full px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
              pathname.includes('/services') ? 'bg-gray-50 text-gray-900' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <MdSettings className="text-lg" />
              <span className="text-sm font-medium">Services</span>
            </div>
            <IoChevronForward className={`text-sm transition-transform ${isServicesOpen ? 'rotate-90' : ''}`} />
          </button>
          {isServicesOpen && (
            <div className="bg-gray-50">
              <Link
                href={`/${role}/services/create-services`}
                className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                  pathname.includes('/services/create-services') ? 'text-green-600 font-medium' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  pathname.includes('/services/create-services') ? 'border-green-600' : 'border-gray-400'
                }`}>
                  {pathname.includes('/services/create-services') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  )}
                </span>
                <span className="text-sm">Create Services</span>
              </Link>
              <Link
                href={`/${role}/services/assign-services`}
                className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                  pathname.includes('/services/assign-services') ? 'text-green-600 font-medium' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  pathname.includes('/services/assign-services') ? 'border-green-600' : 'border-gray-400'
                }`}>
                  {pathname.includes('/services/assign-services') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  )}
                </span>
                <span className="text-sm">Assign Services</span>
              </Link>
            </div>
          )}
        </div>

        {/* Reports */}
        <div>
          <button
            onClick={() => setIsReportsOpen(!isReportsOpen)}
            className={`flex items-center justify-between w-full px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
              pathname.includes('/reports') ? 'bg-gray-50 text-gray-900' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <HiDocumentReport className="text-lg" />
              <span className="text-sm font-medium">Reports</span>
            </div>
            <IoChevronForward className={`text-sm transition-transform ${isReportsOpen ? 'rotate-90' : ''}`} />
          </button>
          {isReportsOpen && (
            <div className="bg-gray-50">
              <Link
                href={`/${role}/reports/short-reports`}
                className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                  pathname.includes('/reports/short-reports') ? 'text-green-600 font-medium' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  pathname.includes('/reports/short-reports') ? 'border-green-600' : 'border-gray-400'
                }`}>
                  {pathname.includes('/reports/short-reports') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  )}
                </span>
                <span className="text-sm">Short Reports</span>
              </Link>
              <Link
                href={`/${role}/reports/details-reports`}
                className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                  pathname.includes('/reports/details-reports') ? 'text-green-600 font-medium' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  pathname.includes('/reports/details-reports') ? 'border-green-600' : 'border-gray-400'
                }`}>
                  {pathname.includes('/reports/details-reports') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  )}
                </span>
                <span className="text-sm">Details Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* Configuration */}
        <Link
          href={`/${role}/configuration`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/configuration') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <FaBell className="text-lg" />
          <span className="text-sm font-medium">Configuration</span>
        </Link>

        {/* Counter Display */}
        <Link
          href={`/${role}/counter-display`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/counter-display') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <FaTv className="text-lg" />
          <span className="text-sm font-medium">Counter Display</span>
        </Link>

        {/* Users */}
        <div>
          <button
            onClick={() => setIsUsersOpen(!isUsersOpen)}
            className={`flex items-center justify-between w-full px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
              pathname.includes('/users') ? 'bg-gray-50 text-gray-900' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <FaUsers className="text-lg" />
              <span className="text-sm font-medium">Users & Permissions</span>
            </div>
            <IoChevronForward className={`text-sm transition-transform ${isUsersOpen ? 'rotate-90' : ''}`} />
          </button>
          {isUsersOpen && (
            <div className="bg-gray-50">
              {/* Create Admin - Only for Super Admin */}
              {isSuperAdmin && (
                <Link
                  href={`/${role}/users/create-admin`}
                  className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                    pathname.includes('/users/create-admin') ? 'text-gray-900 font-medium' : ''
                  }`}
                >
                  <span className="text-xs">•</span>
                  <span className="text-sm">Create Admin</span>
                </Link>
              )}
              <Link
                href={`/${role}/users/user&sessions`}
                className={`flex items-center gap-3 px-14 py-2 text-gray-600 hover:bg-gray-100 transition-colors ${
                  pathname.includes('/users/user&sessions') ? 'text-gray-900 font-medium' : ''
                }`}
              >
                <span className="text-xs">•</span>
                <span className="text-sm">User & Sessions</span>
              </Link>
            </div>
          )}
        </div>

        {/* Display Screens Sessions */}
        <Link
          href={`/${role}/display-screens-sessions`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/display-screens-sessions') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <MdDashboard className="text-lg" />
          <span className="text-sm font-medium">Display Screens Sessions</span>
        </Link>

        {/* User Dashboard Btns */}
        <Link
          href={`/${role}/user-dashboard-btns`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/user-dashboard-btns') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <FaTv className="text-lg" />
          <span className="text-sm font-medium">User Dashboard Btns</span>
        </Link>

        {/* Logout */}
        <Link
          href={`/${role}/logout`}
          className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
            pathname.includes('/logout') ? 'bg-gray-50 text-gray-900 border-r-2 border-green-500' : ''
          }`}
        >
          <FaSignOutAlt className="text-lg" />
          <span className="text-sm font-medium">Logout</span>
        </Link>
      </nav>
    </aside>
  );
}
