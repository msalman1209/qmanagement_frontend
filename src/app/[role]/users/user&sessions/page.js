'use client';
import { useState, useEffect } from 'react';
import { FaEye, FaSignOutAlt, FaPlus, FaUser, FaEnvelope, FaLock, FaUserTag, FaTimes } from 'react-icons/fa';
import axios from '@/utils/axiosInstance';
import { getToken, getUser } from '@/utils/sessionStorage';

export default function UserManagementPage({ adminId: propAdminId }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userCount, setUserCount] = useState(0);
  
  // ✅ Use adminId from prop OR from logged-in user's session
  const [adminId, setAdminId] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [licenseInfo, setLicenseInfo] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    status: 'active',
    adminId: '',
    permissions: {
      canCreateTickets: true,
      canViewReports: false,
      canManageQueue: false,
      canCallTickets: false,
      canAccessDashboard: false,
      canManageUsers: false,
      canManageTickets: false,
      canManageSettings: false,
      canManageCounters: false,
      canManageServices: false
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    status: 'active',
    adminId: '',
    permissions: {
      canCreateTickets: true,
      canViewReports: false,
      canManageQueue: false,
      canCallTickets: false,
      canAccessDashboard: false,
      canManageUsers: false,
      canManageTickets: false,
      canManageSettings: false,
      canManageCounters: false,
      canManageServices: false
    }
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // ✅ Initialize adminId from prop or session
  useEffect(() => {
    if (propAdminId) {
      setAdminId(propAdminId);
      setSelectedAdminId(String(propAdminId));
      console.log('✅ Using admin_id from prop:', propAdminId);
    } else {
      const sessionUser = getUser();
      if (sessionUser && sessionUser.admin_id) {
        setAdminId(sessionUser.admin_id);
        setSelectedAdminId(String(sessionUser.admin_id));
        console.log('✅ Using admin_id from logged-in user:', sessionUser.admin_id);
      } else if (sessionUser && sessionUser.role === 'admin') {
        setAdminId(sessionUser.id);
        setSelectedAdminId(String(sessionUser.id));
        console.log('✅ Using admin_id from admin user:', sessionUser.id);
      } else {
        console.error('❌ No admin_id found in session');
      }
    }
  }, [propAdminId]);

  const fetchUsers = async (targetAdminId) => {
    const token = getToken();
    if (!token) return;
    try {
      // Use the new API endpoint for admin-specific users
      const endpoint = targetAdminId 
        ? `${apiUrl}/users/admin/${targetAdminId}`
        : `${apiUrl}/admin/users`;
      console.debug('[Users][GET] ->', endpoint, 'adminId:', targetAdminId);
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const list = res.data.data || res.data.users || res.data;
      if (Array.isArray(list)) {
        console.log('[Users] Fetched users with login status:', list.map(u => ({ 
          id: u.id, 
          username: u.username, 
          isLoggedIn: u.isLoggedIn 
        })));
        setUsers(list);
        setUserCount(list.length);
      }
      
      // Fetch license info for this admin
      if (targetAdminId) {
        fetchLicenseInfo(targetAdminId);
      }
    } catch (e) {
      console.error('[Users][GET] error', e.response?.data || e.message);
    }
  };

  const fetchLicenseInfo = async (targetAdminId) => {
    const token = getToken();
    if (!token || !targetAdminId) {
      console.log('⏭️ Skipping license fetch - no token or adminId');
      return;
    }
    
    // ✅ Only fetch license if user is admin or super_admin
    const sessionUser = getUser();
    console.log('🔍 License fetch check - User role:', sessionUser?.role, 'User:', sessionUser?.username);
    
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'super_admin')) {
      console.log('ℹ️ License info only available for admins - skipping for role:', sessionUser?.role);
      setLicenseInfo(null);
      return;
    }
    
    console.log('📊 Fetching license info for admin:', targetAdminId);
    try {
      const res = await axios.get(`${apiUrl}/license/admin-license/${targetAdminId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        setLicenseInfo(res.data.data);
        console.log('✅ License info loaded successfully');
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch license info:', e.response?.data?.message || e.message);
      setLicenseInfo(null);
    }
  };

  const fetchAdmins = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${apiUrl}/admin/admins`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const adminList = (res.data.admins || []).filter(a => a.role === 'admin');
        setAdmins(adminList);
        // Auto-select first admin for superadmin
        if (adminList.length > 0) {
          const firstAdminId = String(adminList[0].id);
          setSelectedAdminId(firstAdminId);
          setFormData(prev => ({ ...prev, adminId: firstAdminId }));
          fetchUsers(firstAdminId);
        }
      }
    } catch (e) {
      console.error('[Admins][GET] error', e.response?.data || e.message);
    }
  };

  const init = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const meRes = await axios.get(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const me = meRes.data.user || meRes.data;
      setCurrentUser(me);
      
      // ✅ Only fetch if adminId is available
      if (adminId) {
        console.log('Fetching users for admin ID:', adminId);
        setFormData(prev => ({ ...prev, adminId: String(adminId) }));
        fetchUsers(adminId);
      } else if (me.role === 'super_admin') {
        // Super admin selects which admin's users to view
        fetchAdmins();
      }
    } catch (e) {
      console.error('[Auth][ME] error', e.response?.data || e.message);
    }
  };

  useEffect(() => { 
    if (adminId || currentUser) {
      init(); 
    }
  }, [adminId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!propAdminId && currentUser?.role === 'super_admin' && selectedAdminId) {
      fetchUsers(selectedAdminId);
    }
  }, [currentUser?.role, selectedAdminId, propAdminId]);

  useEffect(() => {
    document.body.style.overflow = (showViewModal || showCreateModal) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showViewModal, showCreateModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePermissionChange = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] }
    }));
  };

  // Toggle all admin permissions for user role
  const handleAdminAccessToggle = () => {
    const hasAdminAccess = formData.permissions.canAccessDashboard;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        canAccessDashboard: !hasAdminAccess,
        canManageUsers: !hasAdminAccess,
        canManageTickets: !hasAdminAccess,
        canManageQueue: !hasAdminAccess,
        canViewReports: !hasAdminAccess,
        canManageSettings: !hasAdminAccess,
        canManageCounters: !hasAdminAccess,
        canManageServices: !hasAdminAccess
      }
    }));
  };

  // Edit helpers
  const handleEdit = (user) => {
    // Parse permissions if it's a string
    let userPermissions = user.permissions;
    if (typeof userPermissions === 'string') {
      try {
        userPermissions = JSON.parse(userPermissions);
      } catch (e) {
        console.error('Failed to parse permissions:', e);
        userPermissions = null;
      }
    }

    setEditForm({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role || 'user',
      status: user.status,
      adminId: user.admin_id ? String(user.admin_id) : '',
      permissions: {
        canCreateTickets: userPermissions?.canCreateTickets ?? true,
        canViewReports: userPermissions?.canViewReports ?? false,
        canManageQueue: userPermissions?.canManageQueue ?? false,
        canCallTickets: userPermissions?.canCallTickets ?? false,
        canAccessDashboard: userPermissions?.canAccessDashboard ?? false,
        canManageUsers: userPermissions?.canManageUsers ?? false,
        canManageTickets: userPermissions?.canManageTickets ?? false,
        canManageSettings: userPermissions?.canManageSettings ?? false,
        canManageCounters: userPermissions?.canManageCounters ?? false,
        canManageServices: userPermissions?.canManageServices ?? false
      }
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditPermissionChange = (perm) => {
    setEditForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] }
    }));
  };

  // Toggle all admin permissions for user role in edit form
  const handleEditAdminAccessToggle = () => {
    const hasAdminAccess = editForm.permissions.canAccessDashboard;
    setEditForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        canAccessDashboard: !hasAdminAccess,
        canManageUsers: !hasAdminAccess,
        canManageTickets: !hasAdminAccess,
        canManageQueue: !hasAdminAccess,
        canViewReports: !hasAdminAccess,
        canManageSettings: !hasAdminAccess,
        canManageCounters: !hasAdminAccess,
        canManageServices: !hasAdminAccess
      }
    }));
  };

  const validateEditForm = () => {
    const errs = {};
    if (!editForm.username.trim()) errs.username = 'Username is required';
    else if (editForm.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!editForm.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(editForm.email)) errs.email = 'Email is invalid';
    if (editForm.password && editForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (editForm.password && editForm.password !== editForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (currentUser?.role === 'super_admin' && !editForm.adminId) errs.adminId = 'Select an admin';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    setEditSubmitting(true);
    try {
      const token = getToken();
      const payload = { username: editForm.username, email: editForm.email, role: editForm.role, status: editForm.status, permissions: editForm.permissions };
      if (editForm.password) payload.password = editForm.password;
      if (currentUser?.role === 'super_admin' && editForm.adminId) payload.admin_id = Number(editForm.adminId);
      const res = await axios.put(`${apiUrl}/admin/users/${editForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data?.message || 'User updated successfully');
      // Refetch to get updated data
      if (currentUser?.role === 'admin') {
        fetchUsers(currentUser.id);
      } else if (selectedAdminId) {
        fetchUsers(selectedAdminId);
      }
      setShowEditModal(false);
    } catch (e) {
      console.error('[Users][EDIT] error', e.response?.data || e.message);
      alert(e.response?.data?.message || 'Failed to update user');
    } finally { setEditSubmitting(false); }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    // Only validate admin selection if adminId not set and user is super_admin
    if (!adminId && !propAdminId && currentUser?.role === 'super_admin' && !formData.adminId) newErrors.adminId = 'Select an admin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // 🔒 Client-side license validation
    // ✅ Always use adminId state
    if (!adminId) {
      alert('❌ Admin ID not found. Please login again.');
      return;
    }
    
    const targetAdminId = adminId;
    const userRole = formData.role || 'user';
    
    // Count users of the same role
    const currentRoleUsers = users.filter(u => u.role === userRole && u.admin_id === targetAdminId);
    const currentCount = currentRoleUsers.length;
    
    // Check license limits
    if (licenseInfo) {
      let maxAllowed = 0;
      let roleLabel = '';
      
      if (userRole === 'user') {
        maxAllowed = licenseInfo.max_users || 10;
        roleLabel = 'users';
      } else if (userRole === 'receptionist') {
        maxAllowed = licenseInfo.max_receptionists || 5;
        roleLabel = 'receptionists';
      } else if (userRole === 'ticket_info') {
        maxAllowed = licenseInfo.max_ticket_info_users || 3;
        roleLabel = 'ticket info users';
      }
      
      if (maxAllowed > 0 && currentCount >= maxAllowed) {
        alert(`⚠️ License Limit Reached!\n\nMaximum ${roleLabel} limit: ${maxAllowed}\nCurrent ${roleLabel}: ${currentCount}\n\nPlease contact tech support to upgrade your license.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const token = getToken();
      // Determine admin_id: use prop adminId if provided (modal mode), else use form selection or current admin
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role || 'user',
        admin_id: adminId, // ✅ Always use adminId state
        status: formData.status,
        permissions: formData.permissions
      };
      console.debug('[Users][POST] payload', payload);
      const res = await axios.post(`${apiUrl}/admin/users`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data?.message || 'User created successfully');
      
      // Refetch users with current adminId
      fetchUsers(adminId);
      
      setFormData(prev => ({
        ...prev,
        username: '', email: '', password: '', confirmPassword: '', status: 'active',
        permissions: {
          canCreateTickets: true,
          canViewReports: false,
          canManageQueue: false,
          canCallTickets: false,
          canAccessDashboard: false,
          canManageUsers: false,
          canManageTickets: false,
          canManageSettings: false,
          canManageCounters: false,
          canManageServices: false
        }
      }));
      setShowCreateModal(false);
    } catch (e) {
      console.error('[Users][POST] error', e.response?.data || e.message);
      alert(e.response?.data?.message || 'Failed to create user');
    } finally { setIsSubmitting(false); }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const token = getToken();
      await axios.put(`${apiUrl}/admin/users/${userId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (e) {
      console.error('[Users][STATUS] error', e.response?.data || e.message);
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleLogout = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Logout ${user.username}? This will end their active session.`)) {
      try {
        const token = getToken();
        await axios.post(`${apiUrl}/admin/users/${userId}/logout`, {}, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        // Update user's login status in UI to 0 (logged out)
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isLoggedIn: 0 } : u
        ));
        
        alert(`${user.username} has been logged out successfully`);
      } catch (e) {
        console.error('[Users][LOGOUT] error', e.response?.data || e.message);
        alert(e.response?.data?.message || 'Failed to logout user');
      }
    }
  };

  const handleView = (user) => {
    // Parse permissions if it's a string
    let userWithParsedPermissions = { ...user };
    if (typeof user.permissions === 'string') {
      try {
        userWithParsedPermissions.permissions = JSON.parse(user.permissions);
      } catch (e) {
        console.error('Failed to parse permissions:', e);
        userWithParsedPermissions.permissions = null;
      }
    }
    setSelectedUser(userWithParsedPermissions);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[calc(100vw-280px)] mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-700 flex items-center gap-3">
          User Management
          {licenseInfo && (
            <span className="text-sm font-normal text-gray-500">
              ({users.filter(u => u.role === 'user').length}/{licenseInfo.max_users} users)
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          {!adminId && !propAdminId && currentUser?.role === 'super_admin' && admins.length > 0 && (
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {admins.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
          )}
          {licenseInfo && users.filter(u => u.role === 'user').length >= licenseInfo.max_users && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ⚠️ User limit reached ({licenseInfo.max_users}/{licenseInfo.max_users})
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <FaPlus /> Create User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Manage Users</h2>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'receptionist' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'ticket_info' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'ticket_info' ? 'Ticket Info' : user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">••••••</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(user)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" title="View Details"><FaEye /></button>
                      <button onClick={() => handleEdit(user)} className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors font-medium">Edit</button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleStatus(user.id)} className={`px-4 py-2 rounded font-medium transition-colors text-sm ${user.status === 'active' ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>{user.status === 'active' ? 'Inactive' : 'Active'}</button>
                        {(user.isLoggedIn === 1 || user.isLoggedIn === '1') && (
                          <button onClick={() => handleLogout(user.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" title="Logout User"><FaSignOutAlt /></button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="relative px-8 py-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><FaEye className="text-blue-600 text-lg" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">View user information</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-8 py-6 space-y-4">
              <DetailRow label="ID" value={selectedUser.id} />
              <DetailRow label="Username" value={selectedUser.username} />
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow label="Role" value={selectedUser.role} badge="purple" />
              <DetailRow label="Password" value="••••••" />
              <DetailRow label="Login Status" value={selectedUser.isLoggedIn ? 'Logged In' : 'Logged Out'} badge={selectedUser.isLoggedIn ? 'blue' : 'gray'} />
              <DetailRow label="Last Login" value={selectedUser.lastLogin || 'Never'} />
              <DetailRow label="Session Expiry" value={selectedUser.sessionExpiry || 'N/A'} />
              <DetailRow label="Account Status" value={selectedUser.status === 'active' ? 'Active' : 'Inactive'} badge={selectedUser.status === 'active' ? 'green' : 'gray'} />
              
              {/* Permissions Section */}
              {selectedUser.permissions && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Permissions</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(selectedUser.permissions).map(([key, value]) => {
                      const labels = {
                        canAccessDashboard: 'Dashboard Access',
                        canManageUsers: 'Manage Users',
                        canManageTickets: 'Manage Tickets',
                        canManageQueue: 'Manage Queue',
                        canViewReports: 'View Reports',
                        canManageSettings: 'Settings Access',
                        canManageCounters: 'Manage Counters',
                        canManageServices: 'Manage Services',
                        canCreateTickets: 'Create Tickets',
                        canCallTickets: 'Call Tickets'
                      };
                      return (
                        <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{labels[key] || key}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {value ? '✓ Enabled' : '✗ Disabled'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95">Close</button>
            </div> */}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowCreateModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                <p className="text-sm text-gray-500 mt-0.5">Add a new user to the system</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><FaTimes size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Username" name="username" value={formData.username} onChange={handleChange} icon={<FaUser />} error={errors.username} required />
                <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<FaEnvelope />} error={errors.email} required />
                <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} icon={<FaLock />} error={errors.password} required />
                <FormInput label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} icon={<FaLock />} error={errors.confirmPassword} required />
                {!adminId && !propAdminId && currentUser?.role === 'super_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Admin <span className="text-red-500">*</span></label>
                    <select name="adminId" value={formData.adminId} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.adminId ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="">Choose an admin...</option>
                      {admins.map(a => <option key={a.id} value={a.id}>{a.username} ({a.email})</option>)}
                    </select>
                    {errors.adminId && <p className="mt-1 text-sm text-red-500">{errors.adminId}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="user">User</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select user role for login access</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  {formData.role === 'admin' ? 'Admin Permissions' : formData.role === 'receptionist' ? 'Receptionist Permissions' : 'User Permissions'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.role === 'user' && (
                    <>
                      <PermissionCheckbox checked={formData.permissions.canCallTickets} onChange={() => handlePermissionChange('canCallTickets')} title="Call Tickets" description="Allow user to call next ticket" />
                      <PermissionCheckbox checked={formData.permissions.canCreateTickets} onChange={() => handlePermissionChange('canCreateTickets')} title="Completed Task" description="Allow user to mark tickets as completed" />
                      <PermissionCheckbox 
                        checked={formData.permissions.canAccessDashboard} 
                        onChange={handleAdminAccessToggle} 
                        title="Admin Access" 
                        description="Grant full admin-level permissions (Dashboard, Users, Tickets, Queue, Reports, Settings, Counters, Services)" 
                      />
                    </>
                  )}
                  {formData.role === 'receptionist' && (
                    <>
                      <PermissionCheckbox checked={formData.permissions.canCreateTickets} onChange={() => handlePermissionChange('canCreateTickets')} title="Create Tickets" description="Allow receptionist to create new tickets" />
                      <PermissionCheckbox checked={formData.permissions.canCallTickets} onChange={() => handlePermissionChange('canCallTickets')} title="Call Tickets" description="Allow receptionist to call next ticket" />
                      <PermissionCheckbox checked={formData.permissions.canManageQueue} onChange={() => handlePermissionChange('canManageQueue')} title="Manage Queue" description="Manage and organize ticket queue" />
                      <PermissionCheckbox checked={formData.permissions.canViewReports} onChange={() => handlePermissionChange('canViewReports')} title="View Reports" description="Access reports and statistics" />
                    </>
                  )}
                  {formData.role === 'admin' && (
                    <>
                      <PermissionCheckbox checked={formData.permissions.canAccessDashboard} onChange={() => handlePermissionChange('canAccessDashboard')} title="Dashboard Access" description="Access admin dashboard" />
                      <PermissionCheckbox checked={formData.permissions.canManageUsers} onChange={() => handlePermissionChange('canManageUsers')} title="Manage Users" description="Create, edit, and delete users" />
                      <PermissionCheckbox checked={formData.permissions.canManageTickets} onChange={() => handlePermissionChange('canManageTickets')} title="Manage Tickets" description="Full ticket management access" />
                      <PermissionCheckbox checked={formData.permissions.canManageQueue} onChange={() => handlePermissionChange('canManageQueue')} title="Manage Queue" description="Queue management and organization" />
                      <PermissionCheckbox checked={formData.permissions.canViewReports} onChange={() => handlePermissionChange('canViewReports')} title="View Reports" description="Access all reports and analytics" />
                      <PermissionCheckbox checked={formData.permissions.canManageSettings} onChange={() => handlePermissionChange('canManageSettings')} title="Settings Access" description="Access system settings" />
                      <PermissionCheckbox checked={formData.permissions.canManageCounters} onChange={() => handlePermissionChange('canManageCounters')} title="Manage Counters" description="Counter configuration and management" />
                      <PermissionCheckbox checked={formData.permissions.canManageServices} onChange={() => handlePermissionChange('canManageServices')} title="Manage Services" description="Service category management" />
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95'}`}>{isSubmitting ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <p className="text-sm text-gray-500 mt-0.5">Update user information</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><FaTimes size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Username" name="username" value={editForm.username} onChange={handleEditChange} icon={<FaUser />} error={editErrors.username} required />
                <FormInput label="Email" name="email" type="email" value={editForm.email} onChange={handleEditChange} icon={<FaEnvelope />} error={editErrors.email} required />
                <FormInput label="Password" name="password" type="password" value={editForm.password} onChange={handleEditChange} icon={<FaLock />} error={editErrors.password} />
                <FormInput label="Confirm Password" name="confirmPassword" type="password" value={editForm.confirmPassword} onChange={handleEditChange} icon={<FaLock />} error={editErrors.confirmPassword} />
                {!adminId && currentUser?.role === 'super_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Admin <span className="text-red-500">*</span></label>
                    <select name="adminId" value={editForm.adminId} onChange={handleEditChange} className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${editErrors.adminId ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="">Choose an admin...</option>
                      {admins.map(a => <option key={a.id} value={a.id}>{a.username} ({a.email})</option>)}
                    </select>
                    {editErrors.adminId && <p className="mt-1 text-sm text-red-500">{editErrors.adminId}</p>}
                    <p className="mt-1 text-xs text-gray-500">This user will be assigned to the selected admin</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={editForm.role} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="user">User</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">User role for login access</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status <span className="text-red-500">*</span></label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  {editForm.role === 'admin' ? 'Admin Permissions' : editForm.role === 'receptionist' ? 'Receptionist Permissions' : 'User Permissions'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editForm.role === 'user' && (
                    <>
                      <PermissionCheckbox checked={editForm.permissions.canCallTickets} onChange={() => handleEditPermissionChange('canCallTickets')} title="Call Tickets" description="Allow user to call next ticket" />
                      <PermissionCheckbox checked={editForm.permissions.canCreateTickets} onChange={() => handleEditPermissionChange('canCreateTickets')} title="Completed Task" description="Allow user to mark tickets as completed" />
                      <PermissionCheckbox 
                        checked={editForm.permissions.canAccessDashboard} 
                        onChange={handleEditAdminAccessToggle} 
                        title="Admin Access" 
                        description="Grant full admin-level permissions (Dashboard, Users, Tickets, Queue, Reports, Settings, Counters, Services)" 
                      />
                    </>
                  )}
                  {editForm.role === 'receptionist' && (
                    <>
                      <PermissionCheckbox checked={editForm.permissions.canCreateTickets} onChange={() => handleEditPermissionChange('canCreateTickets')} title="Create Tickets" description="Allow receptionist to create new tickets" />
                      <PermissionCheckbox checked={editForm.permissions.canCallTickets} onChange={() => handleEditPermissionChange('canCallTickets')} title="Call Tickets" description="Allow receptionist to call next ticket" />
                      <PermissionCheckbox checked={editForm.permissions.canManageQueue} onChange={() => handleEditPermissionChange('canManageQueue')} title="Manage Queue" description="Manage and organize ticket queue" />
                      <PermissionCheckbox checked={editForm.permissions.canViewReports} onChange={() => handleEditPermissionChange('canViewReports')} title="View Reports" description="Access reports and statistics" />
                    </>
                  )}
                  {editForm.role === 'admin' && (
                    <>
                      <PermissionCheckbox checked={editForm.permissions.canAccessDashboard} onChange={() => handleEditPermissionChange('canAccessDashboard')} title="Dashboard Access" description="Access admin dashboard" />
                      <PermissionCheckbox checked={editForm.permissions.canManageUsers} onChange={() => handleEditPermissionChange('canManageUsers')} title="Manage Users" description="Create, edit, and delete users" />
                      <PermissionCheckbox checked={editForm.permissions.canManageTickets} onChange={() => handleEditPermissionChange('canManageTickets')} title="Manage Tickets" description="Full ticket management access" />
                      <PermissionCheckbox checked={editForm.permissions.canManageQueue} onChange={() => handleEditPermissionChange('canManageQueue')} title="Manage Queue" description="Queue management and organization" />
                      <PermissionCheckbox checked={editForm.permissions.canViewReports} onChange={() => handleEditPermissionChange('canViewReports')} title="View Reports" description="Access all reports and analytics" />
                      <PermissionCheckbox checked={editForm.permissions.canManageSettings} onChange={() => handleEditPermissionChange('canManageSettings')} title="Settings Access" description="Access system settings" />
                      <PermissionCheckbox checked={editForm.permissions.canManageCounters} onChange={() => handleEditPermissionChange('canManageCounters')} title="Manage Counters" description="Counter configuration and management" />
                      <PermissionCheckbox checked={editForm.permissions.canManageServices} onChange={() => handleEditPermissionChange('canManageServices')} title="Manage Services" description="Service category management" />
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={editSubmitting} className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all ${editSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'}`}>{editSubmitting ? (<span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Updating...</span>) : 'Update User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function DetailRow({ label, value, badge }) {
  const badgeClass = badge === 'green' ? 'bg-green-100 text-green-800' : 
                      badge === 'blue' ? 'bg-blue-100 text-blue-800' : 
                      badge === 'purple' ? 'bg-purple-100 text-purple-800' : 
                      'bg-gray-100 text-gray-800';
  return (
    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      {badge ? (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{value}</span>
      ) : (
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      )}
    </div>
  );
}

function FormInput({ label, name, value, onChange, icon, type = 'text', error, required }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function PermissionCheckbox({ checked, onChange, title, description }) {
  return (
    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}

