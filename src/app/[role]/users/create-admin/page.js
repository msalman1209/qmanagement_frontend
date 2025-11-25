'use client';
import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaLock, FaUserShield, FaBuilding, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import axios from 'axios';

export default function CreateAdminPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseStartDate: '',
    licenseEndDate: '',
    role: 'admin',
    status: 'active',
    maxUsers: 10,
    maxCounters: 10,
    permissions: {
      manageUsers: true,
      manageServices: true,
      viewReports: true,
      manageConfiguration: false
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        // Filter to show only admins with role='admin' (not super_admin)
        const adminUsers = (response.data.admins || []).filter(admin => admin.role === 'admin');
        setAdmins(adminUsers);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      licenseStartDate: '',
      licenseEndDate: '',
      role: 'admin',
      status: 'active',
      maxUsers: 10,
      maxCounters: 10,
      permissions: {
        manageUsers: true,
        manageServices: true,
        viewReports: true,
        manageConfiguration: false
      }
    });
    setErrors({});
    setEditingAdmin(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      confirmPassword: '',
      licenseStartDate: admin.license_start_date ? admin.license_start_date.split('T')[0] : '',
      licenseEndDate: admin.license_end_date ? admin.license_end_date.split('T')[0] : '',
      role: admin.role || 'admin',
      status: admin.status || 'active',
      maxUsers: admin.max_users || 10,
      maxCounters: admin.max_counters || 10,
      permissions: {
        manageUsers: admin.manage_users !== false,
        manageServices: admin.manage_services !== false,
        viewReports: admin.view_reports !== false,
        manageConfiguration: admin.manage_configuration === true
      }
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await axios.delete(`${apiUrl}/admin/admins/${adminId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        alert('Admin deleted successfully!');
        fetchAdmins();
      } else {
        alert(response.data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert(error.response?.data?.message || 'Failed to delete admin. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.licenseStartDate) {
      newErrors.licenseStartDate = 'License start date is required';
    }

    if (!formData.licenseEndDate) {
      newErrors.licenseEndDate = 'License end date is required';
    } else if (formData.licenseStartDate && formData.licenseEndDate && new Date(formData.licenseEndDate) <= new Date(formData.licenseStartDate)) {
      newErrors.licenseEndDate = 'End date must be after start date';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password is required only when creating new admin
    if (!editingAdmin) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // When editing, password is optional but if provided must match
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to create an admin');
        setIsSubmitting(false);
        return;
      }

      // Get API URL from environment variable
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      // Prepare request body
      const requestBody = {
        username: formData.username,
        email: formData.email,
        licenseStartDate: formData.licenseStartDate,
        licenseEndDate: formData.licenseEndDate,
        role: formData.role,
        status: formData.status,
        maxUsers: parseInt(formData.maxUsers),
        maxCounters: parseInt(formData.maxCounters),
        permissions: {
          manage_users: formData.permissions.manageUsers,
          manage_services: formData.permissions.manageServices,
          view_reports: formData.permissions.viewReports,
          manage_configuration: formData.permissions.manageConfiguration
        }
      };

      // Add password only if provided
      if (formData.password) {
        requestBody.password = formData.password;
      }

      const url = editingAdmin 
        ? `${apiUrl}/admin/admins/${editingAdmin.id}`
        : `${apiUrl}/admin/admins`;

      // Make API call to create or update admin
      const response = editingAdmin
        ? await axios.put(url, requestBody, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        : await axios.post(url, requestBody, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

      if (response.data && response.data.success) {
        // Success
        alert(editingAdmin ? 'Admin updated successfully!' : 'Admin created successfully!');
        
        // Close modal and refresh list
        closeModal();
        fetchAdmins();
      } else {
        // Error from API
        alert(response.data.message || `Failed to ${editingAdmin ? 'update' : 'create'} admin. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      alert(error.response?.data?.message || `Failed to ${editingAdmin ? 'update' : 'create'} admin. Please check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-700">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system administrators</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          <FaPlus /> Create Admin
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Counters
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No admins found. Click "Create Admin" to add one.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUserShield className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{admin.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{admin.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.license_start_date && admin.license_end_date ? (
                        <div>
                          <div>{new Date(admin.license_start_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">to {new Date(admin.license_end_date).toLocaleDateString()}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.max_users || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.max_counters || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                        title="Edit Admin"
                      >
                        <FaEdit className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Admin"
                      >
                        <FaTrash className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-700">
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* License Start Date */}
            <div>
              <label htmlFor="licenseStartDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                License Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="licenseStartDate"
                name="licenseStartDate"
                value={formData.licenseStartDate}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.licenseStartDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.licenseStartDate && (
                <p className="mt-1 text-sm text-red-500">{errors.licenseStartDate}</p>
              )}
            </div>

            {/* License End Date */}
            <div>
              <label htmlFor="licenseEndDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                License End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="licenseEndDate"
                name="licenseEndDate"
                value={formData.licenseEndDate}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.licenseEndDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.licenseEndDate && (
                <p className="mt-1 text-sm text-red-500">{errors.licenseEndDate}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password {!editingAdmin && <span className="text-red-500">*</span>}
                {editingAdmin && <span className="text-xs text-gray-500">(Leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password {!editingAdmin && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Max Users */}
            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700 mb-2">
                Max Users Allowed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maxUsers"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter max users"
              />
              <p className="mt-1 text-xs text-gray-500">Default: 10 users (Super admin can increase)</p>
            </div>

            {/* Max Counters */}
            <div>
              <label htmlFor="maxCounters" className="block text-sm font-medium text-gray-700 mb-2">
                Max Counters Allowed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maxCounters"
                name="maxCounters"
                value={formData.maxCounters}
                onChange={handleChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter max counters"
              />
              <p className="mt-1 text-xs text-gray-500">Default: 10 counters (Super admin can increase)</p>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.permissions.manageUsers}
                  onChange={() => handlePermissionChange('manageUsers')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Manage Users</p>
                  <p className="text-xs text-gray-500">Create, edit, and delete users</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.permissions.manageServices}
                  onChange={() => handlePermissionChange('manageServices')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Manage Services</p>
                  <p className="text-xs text-gray-500">Create and assign services</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.permissions.viewReports}
                  onChange={() => handlePermissionChange('viewReports')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">View Reports</p>
                  <p className="text-xs text-gray-500">Access system reports and analytics</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.permissions.manageConfiguration}
                  onChange={() => handlePermissionChange('manageConfiguration')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Manage Configuration</p>
                  <p className="text-xs text-gray-500">Modify system settings</p>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {editingAdmin ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                editingAdmin ? 'Update Admin' : 'Create Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
      )}
    </div>
  );
}
