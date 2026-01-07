'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import { getToken } from '@/utils/sessionStorage';

export default function CreateServicesPage({ adminId }) {
  const router = useRouter();
  const [serviceNameEnglish, setServiceNameEnglish] = useState('');
  const [serviceNameArabic, setServiceNameArabic] = useState('');
  const [initialTicket, setInitialTicket] = useState('');
  const [serviceColor, setServiceColor] = useState('#000000');
  const [uploadLogo, setUploadLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [mainService, setMainService] = useState('');
  const [showSubServicePopup, setShowSubServicePopup] = useState('No');

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch all services on component mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token available, redirecting to login');
      router.push('/login');
      return;
    }
    fetchServices();
  }, [adminId, router]);

  const fetchServices = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.warn('⚠️ No token available, skipping fetchServices');
        return;
      }
      
      // If adminId is provided, fetch services for that admin, otherwise fetch all
      const url = adminId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/services/admin/${adminId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/services/all`;
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to fetch services');
    }
  };

  const handleAddService = async () => {
    if (!serviceNameEnglish || !serviceNameArabic || !initialTicket) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('service_name', serviceNameEnglish);
      formData.append('service_name_arabic', serviceNameArabic);
      formData.append('initial_ticket', initialTicket);
      formData.append('color', serviceColor);
      
      // If adminId is provided (from modal), include it
      if (adminId) {
        formData.append('admin_id', adminId);
      }
      
      if (uploadLogo) {
        console.log('📤 Uploading logo:', uploadLogo.name, uploadLogo.type, uploadLogo.size, 'bytes');
        formData.append('logo', uploadLogo);
      } else {
        console.log('⚠️ No logo selected');
      }
      
      // Debug: Log FormData contents
      console.log('📦 FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/services/update/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/services/create`;
      
      const method = editingId ? 'put' : 'post';

      const response = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type - let browser set it automatically with boundary
        }
      });

      if (response.data.success) {
        alert(editingId ? 'Service updated successfully!' : 'Service created successfully!');
        resetForm();
        fetchServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServiceNameEnglish('');
    setServiceNameArabic('');
    setInitialTicket('');
    setServiceColor('#000000');
    setUploadLogo(null);
    setLogoPreview(null);
    setEditingId(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleEdit = (service) => {
    setServiceNameEnglish(service.service_name);
    setServiceNameArabic(service.service_name_arabic);
    setInitialTicket(service.initial_ticket);
    setServiceColor(service.color);
    setEditingId(service.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/services/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Service deleted successfully!');
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
                onChange={(e) => {
                  const value = e.target.value.slice(0, 1).toUpperCase();
                  setInitialTicket(value);
                }}
                maxLength={1}
                placeholder="A"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.svg,.webp,image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
                      if (!allowedTypes.includes(file.type)) {
                        alert('❌ Invalid file type! Only JPG, PNG, GIF, SVG, and WebP images are allowed.');
                        e.target.value = '';
                        return;
                      }
                      
                      // Validate file size (5MB)
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        alert('❌ File too large! Maximum size is 5MB.');
                        e.target.value = '';
                        return;
                      }
                      
                      console.log('✅ File selected:', file.name, file.type, file.size);
                      setUploadLogo(file);
                      // Create preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLogoPreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      console.log('❌ No file selected');
                      setUploadLogo(null);
                      setLogoPreview(null);
                    }
                  }}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {logoPreview && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={logoPreview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded border-2 border-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadLogo(null);
                        setLogoPreview(null);
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {uploadLogo && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Selected: {uploadLogo.name} ({(uploadLogo.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Allowed: JPG, PNG, GIF, SVG, WebP | Max size: 5MB
              </p>
            </div>

            {/* Main Service */}
            {/* <div>
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
            </div> */}

            {/* Show Sub-Service Popup */}
            {/* <div>
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
            </div> */}
          </div>

          {/* Add Service Button */}
          <div className="mt-6">
            <button
              onClick={handleAddService}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (editingId ? 'Update Service' : 'Add Service')}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="ml-3 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Logo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Service Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Initial Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Color</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No services found. Create your first service above.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {service.logo_url ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL_WS}${service.logo_url}`} 
                          alt={service.service_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{service.service_name}</div>
                      <div className="text-gray-500 text-xs">{service.service_name_arabic}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{service.initial_ticket}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: service.color }}
                        ></div>
                        <span>{service.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Time Restrictions */}
      {/* <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Global Time Restrictions</h2>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">No time restriction set yet</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="mt-6">
            <button
              onClick={handleAddTimeRestriction}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
            >
              Add Time Restriction
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
}
