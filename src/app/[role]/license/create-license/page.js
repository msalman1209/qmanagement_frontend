'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { setLoading, setError, addLicense } from '@/store/slices/licenseSlice';
import { FaCog, FaUser, FaChartBar, FaEye, FaEyeSlash, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function CreateLicensePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector((state) => state.auth.token);
  
  const [formData, setFormData] = useState({
    license_key: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    license_type: 'basic',
    start_date: '',
    expiry_date: '',
    max_users: 10,
    max_counters: 10,
    max_receptionists: 5,
    max_ticket_info_users: 3,
    max_sessions_per_receptionist: 1,
    max_sessions_per_ticket_info: 1,
    status: 'active',
    admin_username: '',
    admin_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const generateLicenseKey = () => {
    // Use only A-F and 0-9 to match backend validation
    const chars = 'ABCDEF0123456789';
    const segments = 4;
    const segmentLength = 4;
    let key = '';
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segmentLength; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < segments - 1) key += '-';
    }
    
    setFormData(prev => ({ ...prev, license_key: key }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(setLoading(true));

    // Get token from localStorage if not in Redux
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!authToken) {
      alert('Authentication required. Please login again.');
      router.push('/login');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Append logo file if selected
      if (logoFile) {
        submitData.append('company_logo', logoFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        dispatch(addLicense(data.data));
        const message = `License created successfully!\n\nAdmin Login Credentials:\nEmail: ${data.data.admin_email}\nPassword: (as set)\n\nAdmin will login using Email and Password.`;
        alert(message);
        router.push(`/${currentUser?.role}/license/list-of-license`);
      } else {
        dispatch(setError(data.message));
        alert(data.message || 'Failed to create license');
      }
    } catch (error) {
      console.error('Create license error:', error);
      dispatch(setError(error.message));
      alert('Failed to create license');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaCog className="text-green-600" />
          Create License
        </h1>
        <p className="text-gray-600 mt-2">Generate a new license for admin</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Company Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo (For Tickets)
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload company logo that will appear on tickets (Max 5MB, Image files only)
              </p>
            </div>
            {logoPreview && (
              <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden">
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* License Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Type *
            </label>
            <select
              name="license_type"
              value={formData.license_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

          {/* Admin Account Details */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <FaUser className="text-blue-600" /> Admin Login Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email (Login) *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@company.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be unique - Admin will use this to login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Username (Display Name) *
              </label>
              <input
                type="text"
                name="admin_username"
                value={formData.admin_username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., John Doe"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Can be same as others - just for display</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-xs text-blue-800 flex items-center gap-2">
              <FaInfoCircle className="text-blue-600" /> <strong>Note:</strong> Admin will login using <strong>Email</strong> and <strong>Password</strong>. Username is just for display.
            </p>
          </div>
        </div>

        {/* License Limits Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <FaChartBar className="text-purple-600" /> License Limits & Restrictions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Users (Total)
              </label>
              <input
                type="number"
                name="max_users"
                value={formData.max_users}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Total users allowed under this admin</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Counters
              </label>
              <input
                type="number"
                name="max_counters"
                value={formData.max_counters}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum counters for queue management</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Receptionists
              </label>
              <input
                type="number"
                name="max_receptionists"
                value={formData.max_receptionists}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum reception role users allowed</p>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Ticket Info Users
              </label>
              <input
                type="number"
                name="max_ticket_info_users"
                value={formData.max_ticket_info_users}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum ticket_info screen users</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Sessions Per Receptionist
              </label>
              <input
                type="number"
                name="max_sessions_per_receptionist"
                value={formData.max_sessions_per_receptionist}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Sessions for reception role (1-5)</p>
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Sessions Per Ticket Info User
              </label>
              <input
                type="number"
                name="max_sessions_per_ticket_info"
                value={formData.max_sessions_per_ticket_info}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Sessions for ticket_info screen (1-5)</p>
            </div>
          </div>
{/* 
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-xs text-yellow-900 flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" /> 
              <span>
                <strong>Session Limit Warning:</strong> If a user exceeds session limit, they must either:
                <br/>• Contact tech support to increase session limit
                <br/>• Delete previous sessions to free up space
              </span>
            </p>
          </div> */}
        </div>

        {/* License Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Key *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="license_key"
              value={formData.license_key}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              required
            />
            <button
              type="button"
              onClick={generateLicenseKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? 'Creating...' : 'Create License'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
