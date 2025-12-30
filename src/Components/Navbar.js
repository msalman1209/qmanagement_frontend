'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { FaBell, FaLock, FaGlobe, FaSignOutAlt, FaInfoCircle, FaUser, FaIdCard, FaBuilding, FaDesktop, FaKey, FaEnvelope } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import MainLogo from '@/Components/images/logo_main.png';

export default function Navbar() {
  const currentUser = useSelector(selectCurrentUser);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [licenseDetails, setLicenseDetails] = useState(null);
  const [loadingLicense, setLoadingLicense] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const roleMapping = {
    'super_admin': 'superadmin',
    'admin': 'admin',
    'user': 'user'
  };
  const role = currentUser ? roleMapping[currentUser.role] || 'user' : 'user';

  // Function to get dashboard route based on role
  const getDashboardRoute = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'super_admin':
        return '/superadmin/license/list-of-license';
      case 'admin':
        return '/admin';
      case 'user':
        return '/user/dashboard';
      default:
        return `/${role}`;
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showPasswordModal || showAboutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPasswordModal, showAboutModal]);

  // Fetch license details when About modal opens
  const fetchLicenseDetails = async () => {
    setLoadingLicense(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/license/details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setLicenseDetails(data);
      }
    } catch (error) {
      console.error('Error fetching license details:', error);
    } finally {
      setLoadingLicense(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.message || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <nav className="bg-[#71dd37] border-b border-gray-200 px-8 py-2.5 sticky top-0 z-50 shadow-md">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href={getDashboardRoute()} className="flex items-center hover:opacity-90 transition-opacity">
            <Image 
              src={MainLogo} 
              alt="Tech Solutionor Logo" 
              width={160} 
              height={36}
              className="h-auto object-contain"
              priority
            />
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              {/* <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200"
                aria-label="Notifications"
              >
                <FaBell className="text-lg" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button> */}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <p className="text-sm text-gray-800">New ticket created</p>
                      <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <p className="text-sm text-gray-800">Service updated</p>
                      <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">User registered</p>
                      <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md text-sm">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {currentUser?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">
                    {currentUser?.role?.replace('_', ' ') || 'Role'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">
                      {currentUser?.username}
                    </p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      onClick={() => {
                        setShowProfile(false);
                        setShowAboutModal(true);
                        fetchLicenseDetails();
                      }}
                    >
                      <FaInfoCircle className="text-base" />
                      <span>About</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <FaLock className="text-base" />
                      <span>Change Password</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setShowProfile(false)}
                    >
                      <FaGlobe className="text-base" />
                      <span>Language</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-200">
                    <Link
                      href={`/${role}/logout`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <FaSignOutAlt className="text-base" />
                      <span>Logout</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* About Modal */}
      {showAboutModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => {
            setShowAboutModal(false);
            setLicenseDetails(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all animate-slideUp max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FaInfoCircle className="text-green-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">About & License Information</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your account and license details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAboutModal(false);
                  setLicenseDetails(null);
                }}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              {loadingLicense ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaUser className="text-green-600 text-lg" />
                      User Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Username</p>
                        <p className="text-sm font-semibold text-gray-900">{currentUser?.username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm font-semibold text-gray-900">{currentUser?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Role</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{currentUser?.role?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">User ID</p>
                        <p className="text-sm font-semibold text-gray-900">{currentUser?.id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* License Information */}
                  {licenseDetails && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaIdCard className="text-green-600 text-lg" />
                        License Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">License Key</p>
                          <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                            {licenseDetails.licenseKey || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            licenseDetails.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {licenseDetails.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">User Limit</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {licenseDetails.userLimit === -1 ? 'Unlimited' : licenseDetails.userLimit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Users</p>
                          <p className="text-sm font-semibold text-gray-900">{licenseDetails.currentUserCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {licenseDetails.issueDate ? new Date(licenseDetails.issueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {licenseDetails.expiryDate 
                              ? new Date(licenseDetails.expiryDate).toLocaleDateString() 
                              : 'No Expiry'}
                          </p>
                        </div>
                        {licenseDetails.companyName && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Company Name</p>
                            <p className="text-sm font-semibold text-gray-900">{licenseDetails.companyName}</p>
                          </div>
                        )}
                      </div>

                      {/* License Usage Bar */}
                      {licenseDetails.userLimit !== -1 && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-600 font-medium">License Usage</p>
                            <p className="text-xs text-gray-600 font-medium">
                              {licenseDetails.currentUserCount} / {licenseDetails.userLimit}
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min((licenseDetails.currentUserCount / licenseDetails.userLimit) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* System Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaDesktop className="text-green-600 text-lg" />
                      System Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Application</p>
                        <p className="text-sm font-semibold text-gray-900">Queue Management System</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">License Key</p>
                        <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                          {licenseDetails?.licenseKey || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Developer By</p>
                        <p className="text-sm font-semibold text-gray-900">Tech Solutionor</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Support</p>
                        <p className="text-sm font-semibold text-gray-900">support@techsolutionor.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError('');
            setPasswordSuccess('');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FaLock className="text-green-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update your account password</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordChange} className="px-8 py-6">
              {/* Error Message */}
              {passwordError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-0.5">{passwordError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {passwordSuccess && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-slideDown">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Success</p>
                      <p className="text-sm text-green-700 mt-0.5">{passwordSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Must be at least 6 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-out;
        }

        /* Hide scrollbar but keep functionality */
        .custom-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .custom-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </>
  );
}
