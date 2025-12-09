'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';  // Use centralized axios instance
import { getToken } from '@/utils/sessionStorage';

export default function AssignServicesPage({ adminId }) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token available, redirecting to login');
      router.push('/login');
      return;
    }

    fetchUsers();
    fetchServices();
    fetchAssignedServices();
  }, [adminId, router]);

  const fetchUsers = async () => {
    try {
      // Axios interceptor will automatically add token
      const url = adminId 
        ? `/users/admin/${adminId}`
        : `/users/all`;
        
      const response = await axios.get(url);
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchServices = async () => {
    try {
      // Axios interceptor will automatically add token
      const url = adminId 
        ? `/services/admin/${adminId}`
        : `/services/all`;
        
      const response = await axios.get(url);
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchAssignedServices = async () => {
    try {
      // Axios interceptor will automatically add token
      const url = adminId
        ? `/services/assigned/admin/${adminId}`
        : `/services/assigned`;
        
      const response = await axios.get(url);
      if (response.data.success) {
        setAssignedServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assigned services:', error);
    }
  };

  const handleServiceToggle = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s.id));
    }
  };

  const handleUserToggle = async (userId) => {
    let updatedUsers;
    if (selectedUsers.includes(userId)) {
      updatedUsers = selectedUsers.filter(u => u !== userId);
    } else {
      updatedUsers = [...selectedUsers, userId];
    }
    setSelectedUsers(updatedUsers);
    
    // Load common services for all selected users
    if (updatedUsers.length > 0) {
      await loadCommonServices(updatedUsers);
    } else {
      setSelectedServices([]);
    }
  };

  const loadCommonServices = async (userIds) => {
    try {
      // Axios interceptor will automatically add token
      
      // Fetch services for all selected users
      const promises = userIds.map(userId =>
        axios.get(`/services/user/${userId}`)
      );

      const responses = await Promise.all(promises);
      
      // Extract service IDs from each user
      const allUserServices = responses.map(response => {
        if (response.data.success && response.data.services) {
          return response.data.services.map(service => service.id);
        }
        return [];
      });

      if (allUserServices.length === 0) {
        setSelectedServices([]);
        return;
      }

      // Find common services across all selected users
      let commonServices = allUserServices[0];
      for (let i = 1; i < allUserServices.length; i++) {
        commonServices = commonServices.filter(serviceId => 
          allUserServices[i].includes(serviceId)
        );
      }

      setSelectedServices(commonServices);
    } catch (error) {
      console.error('Error loading common services:', error);
      setSelectedServices([]);
    }
  };

  const handleAssignServices = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      // Axios interceptor will automatically add token
      
      // Assign services to multiple users
      const promises = selectedUsers.map(userId => {
        const payload = {
          user_id: userId,
          service_ids: selectedServices
        };
        
        // If adminId is provided (from modal), include it
        if (adminId) {
          payload.admin_id = adminId;
        }
        
        return axios.post(
          '/services/assign',
          payload
        );
      });

      await Promise.all(promises);
      
      alert('Services assigned successfully to all selected users!');
      setSelectedUsers([]);
      setSelectedServices([]);
      fetchAssignedServices();
    } catch (error) {
      console.error('Error assigning services:', error);
      alert('Failed to assign services');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async (userId) => {
    if (!confirm('Are you sure you want to remove all services from this user?')) {
      return;
    }

    try {
      // Axios interceptor will automatically add token
      const response = await axios.delete(`/services/assigned/${userId}`);

      if (response.data.success) {
        alert('All services removed successfully!');
        fetchAssignedServices();
      }
    } catch (error) {
      console.error('Error deleting services:', error);
      alert('Failed to remove services');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Admin Assign Services</h1>

      {/* Assigned Services Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Assigned Services</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignedServices.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No services assigned yet
                  </td>
                </tr>
              ) : (
                assignedServices.map((item) => (
                  <tr key={item.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{item.username}</div>
                      {/* <div className="text-gray-500 text-xs">{item.email}</div> */}
                    </td>
                    <td className="px-6 py-4">
                      {item.services ? (
                        <div className="flex flex-wrap gap-1">
                          {item.services.split(', ').map((service, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  text-gray-800"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">No services assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteAll(item.user_id)}
                        className="px-4 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Delete All
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Services to User */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Assign Services to User</h2>
        </div>
        
        <div className="p-6">
          {/* Assign to User Dropdown */}
          <div className="mb-6 relative">
            <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
              Assign to Users ({selectedUsers.length} selected)
            </label>
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700 cursor-pointer bg-white flex items-center justify-between"
            >
              <span>
                {selectedUsers.length === 0 
                  ? 'Select Users' 
                  : selectedUsers.length === 1
                  ? users.find(u => u.id === selectedUsers[0])?.username
                  : `${selectedUsers.length} users selected`
                }
              </span>
              <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {showUserDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No users available</div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                      />
                      <span className="ml-2 text-sm text-gray-700">{user.username}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Select Services */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 uppercase mb-3">
              Select Services
            </label>
            
            <div className="space-y-2">
              {/* Select All Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedServices.length === services.length && services.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-gray-700 font-medium">
                  Select All
                </label>
              </div>

              {/* Individual Service Checkboxes */}
              {services.length === 0 ? (
                <p className="text-sm text-gray-500 ml-6">No services available. Create services first.</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-700">
                      {service.service_name} ({service.service_name_arabic})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assign Services Button */}
          <div>
            <button
              onClick={handleAssignServices}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Services'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
