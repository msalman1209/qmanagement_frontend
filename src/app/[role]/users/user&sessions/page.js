'use client';
import { useState, useEffect } from 'react';
import { FaEye, FaSignOutAlt } from 'react-icons/fa';

export default function UserManagementPage() {
  const [users, setUsers] = useState([
    {
      id: 9,
      username: 'user18',
      email: 'users@gmail.com',
      password: 'user18',
      status: 'active',
      lastLogin: '2024-11-24 10:30 AM',
      sessionExpiry: '2024-11-24 11:30 AM',
      isLoggedIn: true
    },
    {
      id: 25,
      username: 'user19',
      email: 'user19@gmail.com',
      password: 'user19',
      status: 'active',
      lastLogin: '2024-11-24 09:15 AM',
      sessionExpiry: '2024-11-24 10:15 AM',
      isLoggedIn: false
    }
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleEdit = (userId) => {
    console.log('Edit user:', userId);
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const handleLogout = (userId) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to logout ${user?.username}?`)) {
      console.log('Logout user:', userId);
      // You can add API call here
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showViewModal]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">User Management</h1>
      
      {/* Manage Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Manage Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.password}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleView(user)}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(user.id)}
                        className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors font-medium"
                      >
                        Edit
                      </button>

                      {/* Toggle Status Button */}
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-4 py-2 rounded font-medium transition-colors text-sm ${
                          user.status === 'active'
                            ? 'bg-gray-500 text-white hover:bg-gray-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {user.status === 'active' ? 'Inactive' : 'Active'}
                      </button>

                      {/* Logout Button */}
                      <button
                        onClick={() => handleLogout(user.id)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        title="Logout User"
                      >
                        <FaSignOutAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaEye className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">View user information</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">ID</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Username</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Password</span>
                  <span className="text-sm font-semibold text-gray-900">••••••</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Login Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedUser.isLoggedIn 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.isLoggedIn ? 'Logged In' : 'Logged Out'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Last Login</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedUser.lastLogin || 'Never'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Session Expiry</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedUser.sessionExpiry || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Account Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedUser.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
