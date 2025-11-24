'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { HiDocumentText } from 'react-icons/hi';

export default function UserSidebar({ username = 'user19', counter = '2' }) {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

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

        {/* User Dashboard */}
        <Link
          href="/user/dashboard"
          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
            isActive('/user/dashboard') 
              ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MdDashboard className="text-base" />
          <span className="text-sm font-normal">User Dashboard</span>
        </Link>

        {/* Completed Tasks */}
        <Link
          href="/user/completed-tasks"
          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
            isActive('/user/completed-tasks') 
              ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HiDocumentText className="text-base" />
          <span className="text-sm font-normal">Completed Tasks</span>
        </Link>

        {/* Profile - Dynamic Route Support */}
        <Link
          href="/user/profile"
          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
            isActive('/user/profile') || pathname === '/user/profile'
              ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FaUser className="text-base" />
          <span className="text-sm font-normal">Profile</span>
        </Link>

        {/* Logout */}
        <Link
          href="/user/logout"
          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
            isActive('/user/logout') 
              ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FaSignOutAlt className="text-base" />
          <span className="text-sm font-normal">Logout</span>
        </Link>
      </nav>
    </aside>
  );
}
