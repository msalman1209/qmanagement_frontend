'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { setLicenseReport, selectLicenseReport } from '@/store/slices/licenseSlice';
import { useRouter } from 'next/navigation';
import { FaEye, FaEdit, FaPause, FaPlay, FaBuilding, FaImage, FaClipboardList, FaChartBar, FaFileAlt, FaCheckCircle, FaPauseCircle, FaTimesCircle, FaExclamationTriangle, FaTimes, FaUpload, FaSave } from 'react-icons/fa';


export default function LicenseReportPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector((state) => state.auth.token);
  const licenseReport = useSelector(selectLicenseReport);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLicenseReport();
  }, []);

  const fetchLicenseReport = async () => {
    try {
      setLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/report`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        dispatch(setLicenseReport(data.data));
      }
    } catch (error) {
      console.error('Failed to fetch license report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (license) => {
    const newStatus = license.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this license?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/${license.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`License ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        fetchLicenseReport(); // Refresh data
      } else {
        alert(data.message || 'Failed to update license status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      alert('Failed to update license status');
    }
  };

  const handleView = (licenseId) => {
    const license = recentLicenses.find(l => l.id === licenseId);
    if (license) {
      setSelectedLicense(license);
      setShowModal(true);
    }
  };

  const handleEdit = (licenseId) => {
    const license = recentLicenses.find(l => l.id === licenseId);
    if (license) {
      setEditFormData({
        id: license.id,
        admin_id: license.admin_id,
        license_type: license.license_type,
        start_date: license.start_date?.split('T')[0],
        expiry_date: license.expiry_date?.split('T')[0],
        status: license.status,
        max_users: license.max_users || 10,
        max_counters: license.max_counters || 5,
        max_receptionists: license.max_receptionists || 5,
        max_ticket_info_users: license.max_ticket_info_users || 3,
        max_sessions_per_receptionist: license.max_sessions_per_receptionist || 1,
        max_sessions_per_ticket_info: license.max_sessions_per_ticket_info || 1,
        company_name: license.company_name,
        company_logo: license.company_logo || '',
        email: license.email || '',
        phone: license.phone || '',
        city: license.city || '',
        country: license.country || ''
      });
      setLogoFile(null);
      setLogoPreview(null);
      setShowEditModal(true);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      
      if (!authToken) {
        alert('Authentication required. Please login again.');
        router.push('/login');
        return;
      }

      console.log('Submitting update with data:', editFormData);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all form fields (including empty strings and zeros)
      Object.keys(editFormData).forEach(key => {
        if (editFormData[key] !== null && editFormData[key] !== undefined && key !== 'company_logo') {
          formData.append(key, editFormData[key]);
        }
      });
      
      // Append logo file if selected
      if (logoFile) {
        formData.append('company_logo', logoFile);
      }

      console.log('Sending request to:', `${process.env.NEXT_PUBLIC_API_URL}/license/${editFormData.id}`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('License updated successfully!');
        setShowEditModal(false);
        setLogoFile(null);
        setLogoPreview(null);
        fetchLicenseReport(); // Refresh data
      } else {
        console.error('Update failed:', data);
        alert(data.message || 'Failed to update license');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`Failed to update license: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditFormData({});
    setLogoFile(null);
    setLogoPreview(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLicense(null);
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showEditModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading license report...</p>
        </div>
      </div>
    );
  }

  const stats = licenseReport?.statistics || {};
  const licensesByType = licenseReport?.licensesByType || [];
  const recentLicenses = licenseReport?.recentLicenses || [];
  const expiringLicenses = licenseReport?.expiringLicenses || [];

  return (
    <div className="p-6">
      {/* Edit License Modal */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit License</h2>
                  <p className="text-green-100 mt-1">Update license information</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center cursor-pointer"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Company Information */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏢</span> Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      value={editFormData.company_name}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={editFormData.city}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={editFormData.country}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Company Logo Upload */}
              <div className="bg-purple-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaImage className="text-purple-600" /> Company Logo (For Tickets)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your company logo to display on printed tickets
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Logo</label>
                    <div className="border-2 border-gray-300 rounded-lg p-4 h-40 flex items-center justify-center bg-white">
                      {editFormData.company_logo ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL_WS}${editFormData.company_logo}`}
                          alt="Company Logo" 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <FaImage className="text-gray-400 text-3xl mb-2 mx-auto" />
                          <p className="text-gray-500 text-sm">No logo uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Upload New Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Logo</label>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-4 h-40 flex flex-col items-center justify-center bg-white">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                            id="logo-upload-edit"
                          />
                          <label 
                            htmlFor="logo-upload-edit"
                            className="cursor-pointer text-center"
                          >
                            <FaUpload className="text-green-400 text-3xl mb-2 mx-auto" />
                            <p className="text-gray-600 text-sm">Click to select logo</p>
                            <p className="text-gray-400 text-xs mt-1">Max 5MB</p>
                          </label>
                        </>
                      )}
                    </div>
                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        className="mt-2 w-full text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <FaTimes /> Remove selected logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* License Details */}
              <div className="bg-blue-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📋</span> License Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
                    <select
                      name="license_type"
                      value={editFormData.license_type}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="trial">Trial</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={editFormData.start_date}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={editFormData.expiry_date}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
                    <input
                      type="number"
                      name="max_users"
                      value={editFormData.max_users}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Counters</label>
                    <input
                      type="number"
                      name="max_counters"
                      value={editFormData.max_counters}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* License Limits & Session Controls */}
              <div className="bg-purple-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-purple-600" /> License Limits & Session Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Receptionists</label>
                    <input
                      type="number"
                      name="max_receptionists"
                      value={editFormData.max_receptionists}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum reception role users</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Ticket Info Users</label>
                    <input
                      type="number"
                      name="max_ticket_info_users"
                      value={editFormData.max_ticket_info_users}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum ticket_info screen users</p>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sessions Per Receptionist</label>
                    <input
                      type="number"
                      name="max_sessions_per_receptionist"
                      value={editFormData.max_sessions_per_receptionist}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="1"
                      max="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Concurrent sessions (1-5)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sessions Per Ticket Info</label>
                    <input
                      type="number"
                      name="max_sessions_per_ticket_info"
                      value={editFormData.max_sessions_per_ticket_info}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="1"
                      max="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Concurrent sessions (1-5)</p>
                  </div> */}
                </div>
                {/* <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-xs text-yellow-900">
                    ⚠️ <strong>Session Limits:</strong> Users must contact tech support to increase limits or delete old sessions
                  </p>
                </div> */}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:bg-gray-400 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Detail Modal */}
      {showModal && selectedLicense && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">License Details</h2>
                  <p className="text-green-100 mt-1">Complete information about this license</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center cursor-pointer"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 ${
                  selectedLicense.license_status === 'expired' ? 'bg-red-100 text-red-800' :
                  selectedLicense.license_status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                  selectedLicense.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedLicense.status === 'active' ? (
                    <>
                      <FaCheckCircle /> Active
                    </>
                  ) : (
                    <>
                      <FaPauseCircle /> Inactive
                    </>
                  )}
                </span>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  selectedLicense.license_type === 'trial' ? 'bg-purple-100 text-purple-800' :
                  selectedLicense.license_type === 'basic' ? 'bg-blue-100 text-blue-800' :
                  selectedLicense.license_type === 'premium' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-pink-100 text-pink-800'
                }`}>
                  {selectedLicense.license_type.toUpperCase()}
                </span>
              </div>

              {/* Company Information */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏢</span> Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLicense.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Admin Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLicense.admin_name}</p>
                  </div>
                  {selectedLicense.email && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLicense.email}</p>
                    </div>
                  )}
                  {selectedLicense.phone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLicense.phone}</p>
                    </div>
                  )}
                  {selectedLicense.city && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLicense.city}, {selectedLicense.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* License Details */}
              <div className="bg-blue-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📋</span> License Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(selectedLicense.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(selectedLicense.expiry_date).toLocaleDateString()}</p>
                  </div>
                  {selectedLicense.days_remaining >= 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                      <p className={`text-sm font-bold ${
                        selectedLicense.days_remaining <= 7 ? 'text-red-600' :
                        selectedLicense.days_remaining <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {selectedLicense.days_remaining} days
                      </p>
                    </div>
                  )}
                  {selectedLicense.max_users && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Max Users</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLicense.max_users}</p>
                    </div>
                  )}
                  {selectedLicense.max_counters && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Max Counters</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLicense.max_counters}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Limits */}
              {(selectedLicense.max_receptionists || selectedLicense.max_ticket_info_users) && (
                <div className="bg-purple-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📊</span> License Limits & Sessions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLicense.max_receptionists && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Max Receptionists</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLicense.max_receptionists}</p>
                      </div>
                    )}
                    {selectedLicense.max_ticket_info_users && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Max Ticket Info Users</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLicense.max_ticket_info_users}</p>
                      </div>
                    )}
                    {selectedLicense.max_sessions_per_receptionist && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Sessions Per Receptionist</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLicense.max_sessions_per_receptionist}</p>
                      </div>
                    )}
                    {selectedLicense.max_sessions_per_ticket_info && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Sessions Per Ticket Info</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLicense.max_sessions_per_ticket_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {selectedLicense.created_at}</span>
                  {selectedLicense.updated_at && (
                    <span>Updated: {selectedLicense.updated_at}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {/* <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0 border-t">
              <button
                onClick={() => {
                  closeModal();
                  handleEdit(selectedLicense.id);
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                ✏️ Edit License
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartBar className="text-green-600" />
          License Report
        </h1>
        <p className="text-gray-600 mt-2">Overview and analytics of all licenses</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Licenses</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total_licenses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaFileAlt className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.active_licenses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">{stats.inactive_licenses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <FaPauseCircle className="text-2xl text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expired</p>
              <p className="text-3xl font-bold text-red-600">{stats.expired_licenses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaTimesCircle className="text-2xl text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.expiring_soon || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-2xl text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* License Distribution by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">License Distribution by Type</h2>
          <div className="space-y-4">
            {licensesByType.map((item) => {
              const total = stats.total_licenses || 1;
              const percentage = ((item.count / total) * 100).toFixed(1);
              const colors = {
                trial: 'bg-purple-500',
                basic: 'bg-blue-500',
                premium: 'bg-indigo-500',
                enterprise: 'bg-pink-500'
              };
              return (
                <div key={item.license_type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.license_type}</span>
                    <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[item.license_type] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {licensesByType.length === 0 && (
              <p className="text-gray-500 text-center py-4">No license data available</p>
            )}
          </div>
        </div>

        {/* Expiring Soon Licenses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Expiring Soon (Next 30 Days)</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expiringLicenses.map((license) => (
              <div key={license.id} className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{license.company_name}</p>
                    <p className="text-xs text-gray-600">{license.license_key}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Expires in</p>
                    <p className="text-sm font-bold text-yellow-700">{license.days_remaining} days</p>
                  </div>
                </div>
              </div>
            ))}
            {expiringLicenses.length === 0 && (
              <p className="text-gray-500 text-center py-4">No licenses expiring soon</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Licenses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Licenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License Key</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentLicenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{license.license_key}</td>
                  <td className="px-4 py-3 text-sm">{license.company_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      license.license_type === 'trial' ? 'bg-purple-100 text-purple-800' :
                      license.license_type === 'basic' ? 'bg-blue-100 text-blue-800' :
                      license.license_type === 'premium' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-pink-100 text-pink-800'
                    }`}>
                      {license.license_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(license.expiry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      license.license_status === 'expired' ? 'bg-red-100 text-red-800' :
                      license.license_status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(license.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                        title="View Details"
                      >
                        <FaEye /> View
                      </button>
                      <button
                        onClick={() => handleEdit(license.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                        title="Edit License"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(license)}
                        className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors shadow-sm flex items-center gap-1 ${
                          license.status === 'active'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={license.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {license.status === 'active' ? (
                          <>
                            <FaPause /> Deactivate
                          </>
                        ) : (
                          <>
                            <FaPlay /> Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {recentLicenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No recent licenses
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
