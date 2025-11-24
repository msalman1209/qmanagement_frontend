'use client';
import { useState } from 'react';

export default function AssignServicesPage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);

  const [assignedServices, setAssignedServices] = useState([
    {
      username: 'user18',
      services: 'Payment Services, Establishment Services, Labor Services, Emirates ID New'
    },
    {
      username: 'user19',
      services: 'Payment Services'
    }
  ]);

  const availableServices = [
    'General Services',
    'Payment Services',
    'Establishment Services',
    'Special Needs',
    'Labor Services',
    'Emirates ID New',
    'Emirates ID Renewal',
    'Emirates ID Replacement',
    'child'
  ];

  const handleServiceToggle = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSelectAll = () => {
    if (selectedServices.length === availableServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices([...availableServices]);
    }
  };

  const handleAssignServices = () => {
    console.log('Assign services to user:', selectedUser, selectedServices);
  };

  const handleDeleteAll = (username) => {
    const updatedServices = assignedServices.filter(item => item.username !== username);
    setAssignedServices(updatedServices);
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
              {assignedServices.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{item.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.services}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteAll(item.username)}
                      className="px-4 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    >
                      Delete All
                    </button>
                  </td>
                </tr>
              ))}
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
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
              Assign to User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
            >
              <option value="">Select User</option>
              <option value="user18">user18</option>
              <option value="user19">user19</option>
              <option value="user20">user20</option>
            </select>
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
                  checked={selectedServices.length === availableServices.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                  Select All
                </label>
              </div>

              {/* Individual Service Checkboxes */}
              {availableServices.map((service, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`service-${index}`}
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor={`service-${index}`} className="ml-2 text-sm text-gray-700">
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Services Button */}
          <div>
            <button
              onClick={handleAssignServices}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
            >
              Assign Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
