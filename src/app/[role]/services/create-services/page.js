'use client';
import { useState } from 'react';

export default function CreateServicesPage() {
  const [serviceNameEnglish, setServiceNameEnglish] = useState('');
  const [serviceNameArabic, setServiceNameArabic] = useState('');
  const [initialTicket, setInitialTicket] = useState('');
  const [serviceColor, setServiceColor] = useState('#000000');
  const [uploadLogo, setUploadLogo] = useState(null);
  const [mainService, setMainService] = useState('');
  const [showSubServicePopup, setShowSubServicePopup] = useState('No');

  const [services, setServices] = useState([
    { name: 'General Services (الخدمات العامة)', initial: 'G', popup: 'No' },
    { name: 'child (Child)', initial: 'C', popup: 'N/A' },
    { name: 'Payment Services (الدفع الخدمات)', initial: 'P', popup: 'No' },
    { name: 'Establishment Services (التأسيس الخدمات)', initial: 'E', popup: 'No' },
    { name: 'Special Needs (ذوي الاحتياجات الخاصة)', initial: 'S', popup: 'No' },
    { name: 'Labor Services (خدمات العمال)', initial: 'L', popup: 'No' },
    { name: 'Emirates ID New (هوية جديدة)', initial: 'N', popup: 'No' },
    { name: 'Emirates ID Renewal (هوية تجديد)', initial: 'R', popup: 'No' },
    { name: 'Emirates ID Replacement (هوية استبدال)', initial: 'P', popup: 'No' },
  ]);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleAddService = () => {
    console.log('Service added');
  };

  const handleEdit = (index) => {
    console.log('Edit service:', index);
  };

  const handleDelete = (index) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
  };

  const handleAddTimeRestriction = () => {
    console.log('Time restriction added');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Admin Service Management</h1>

      {/* Manage Services Card */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Manage Services</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Name English */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Service Name (English)
              </label>
              <input
                type="text"
                value={serviceNameEnglish}
                onChange={(e) => setServiceNameEnglish(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Service Name Arabic */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Service Name (Arabic)
              </label>
              <input
                type="text"
                value={serviceNameArabic}
                onChange={(e) => setServiceNameArabic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Initial Ticket */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Initial Ticket
              </label>
              <input
                type="text"
                value={initialTicket}
                onChange={(e) => setInitialTicket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Service Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Service Color
              </label>
              <input
                type="color"
                value={serviceColor}
                onChange={(e) => setServiceColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Upload Logo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Upload Logo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => setUploadLogo(e.target.files[0])}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>

            {/* Main Service */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Main Service (If Sub Service)
              </label>
              <select
                value={mainService}
                onChange={(e) => setMainService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">Select Main Service (If applicable)</option>
                <option value="general">General Services</option>
                <option value="payment">Payment Services</option>
              </select>
            </div>

            {/* Show Sub-Service Popup */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Show Sub-Service Popup?
              </label>
              <select
                value={showSubServicePopup}
                onChange={(e) => setShowSubServicePopup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Add Service Button */}
          <div className="mt-6">
            <button
              onClick={handleAddService}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
            >
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Available Services Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Available Services</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Initial Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Show Sub-Service Popup</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{service.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{service.initial}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{service.popup}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(index)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Time Restrictions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Global Time Restrictions</h2>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">No time restriction set yet</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Add Time Restriction Button */}
          <div className="mt-6">
            <button
              onClick={handleAddTimeRestriction}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
            >
              Add Time Restriction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
