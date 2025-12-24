'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import axiosRaw from 'axios'; // Raw axios for file uploads
import { getToken, getUser } from '@/utils/sessionStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CounterDisplayPage({ adminId: propAdminId }) {
  const router = useRouter();
  // Get current user from session
  const currentUser = getUser();
  
  // ✅ Use adminId from prop OR from logged-in user's session
  const [adminId, setAdminId] = useState(null);
  
  useEffect(() => {
    if (propAdminId) {
      setAdminId(propAdminId);
      console.log('✅ Using admin_id from prop:', propAdminId);
    } else if (currentUser && currentUser.admin_id) {
      setAdminId(currentUser.admin_id);
      console.log('✅ Using admin_id from logged-in user:', currentUser.admin_id);
    } else {
      console.error('❌ No admin_id found');
    }
  }, [propAdminId, currentUser]);
  
  const [contentType, setContentType] = useState('video'); // 'video' or 'images'
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [leftLogo, setLeftLogo] = useState(null);
  const [leftLogoUrl, setLeftLogoUrl] = useState('');
  const [rightLogo, setRightLogo] = useState(null);
  const [rightLogoUrl, setRightLogoUrl] = useState('');
  const [screenType, setScreenType] = useState('horizontal');
  const [sliderImages, setSliderImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [sliderTimer, setSliderTimer] = useState(5);
  const [tickerContent, setTickerContent] = useState('Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Ticket Info User Management
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [ticketInfoUsers, setTicketInfoUsers] = useState([]);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // Load existing configuration on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token available, redirecting to login');
      router.push('/login');
      return;
    }
    
    // ✅ Only fetch if adminId is available
    if (adminId) {
      fetchConfiguration();
      fetchTicketInfoUsers();
    }
  }, [adminId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCreateUserModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateUserModal]);

  const fetchConfiguration = async () => {
    try {
      // ✅ Always require adminId
      if (!adminId) {
        console.error('❌ No adminId available - cannot fetch configuration');
        return;
      }
      
      const url = `${API_URL}/counter-display/config?adminId=${adminId}`;
      console.log('📡 Fetching config from:', url);
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        const { config, images } = response.data;
        
        if (config) {
          setLeftLogoUrl(config.left_logo_url || '');
          setRightLogoUrl(config.right_logo_url || '');
          setScreenType(config.screen_type || 'horizontal');
          setContentType(config.content_type || 'video');
          setVideoUrl(config.video_url || '');
          setSliderTimer(config.slider_timer || 5);
          setTickerContent(config.ticker_content || 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C');
        }

        if (images && images.length > 0) {
          const formattedImages = images.map(img => ({
            id: img.id,
            preview: `${process.env.NEXT_PUBLIC_API_URL_WS}${img.image_url}`,
            name: img.image_name,
            file: null
          }));
          setSliderImages(formattedImages);
          
          const selectedIds = images.filter(img => img.is_selected).map(img => img.id);
          setSelectedImages(selectedIds);
        }
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      showMessage('error', 'Failed to load configuration');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fetch Ticket Info Users
  const fetchTicketInfoUsers = async () => {
    try {
      // ✅ Always require adminId
      if (!adminId) {
        console.warn('⚠️ Admin ID not available for fetching ticket info users');
        return;
      }
      
      const url = `${API_URL}/user/ticket-info-users?adminId=${adminId}`;
      console.log('📡 Fetching ticket info users from:', url);
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setTicketInfoUsers(response.data.users || []);
        console.log('✅ Fetched', response.data.users?.length || 0, 'ticket info users');
      }
    } catch (error) {
      console.error('❌ Error fetching ticket info users:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  // Create Ticket Info User
  const handleCreateTicketInfoUser = async (e) => {
    e.preventDefault();
    
    if (!newUserData.username || !newUserData.email || !newUserData.password) {
      showMessage('error', 'Please fill all fields');
      return;
    }

    // ✅ Always require adminId
    if (!adminId) {
      showMessage('error', 'Admin ID not found. Please login again.');
      return;
    }

    console.log('📝 Creating Ticket Info User:', {
      username: newUserData.username,
      email: newUserData.email,
      admin_id: adminId
    });

    try {
      const url = `${API_URL}/user/create-ticket-info`;
      console.log('📤 Creating user at:', url);
      const response = await axios.post(url, {
        ...newUserData,
        admin_id: adminId,
        role: 'ticket_info'
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.data.success) {
        showMessage('success', 'Ticket Info user created successfully!');
        setShowCreateUserModal(false);
        setNewUserData({ username: '', email: '', password: '' });
        fetchTicketInfoUsers();
        console.log('✅ User created successfully');
      } else {
        showMessage('error', response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('❌ Error creating ticket info user:', error);
      console.error('Error response:', error.response?.data);
      showMessage('error', error.response?.data?.message || 'Failed to create user');
    }
  };

  // Delete Ticket Info User
  const handleDeleteTicketInfoUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const url = `${API_URL}/user/${userId}`;
      console.log('🗑️ Deleting user at:', url);
      const response = await axios.delete(url, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        showMessage('success', 'User deleted successfully');
        fetchTicketInfoUsers();
        console.log('✅ User deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      showMessage('error', error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleContentTypeChange = (type) => {
    // Clear existing content when switching
    if (type === 'video' && sliderImages.length > 0) {
      if (!confirm('Switching to video will remove all selected images. Continue?')) {
        return;
      }
      setSliderImages([]);
      setSelectedImages([]);
    } else if (type === 'images' && uploadedVideo) {
      if (!confirm('Switching to images will remove the selected video. Continue?')) {
        return;
      }
      setUploadedVideo(null);
    }
    setContentType(type);
  };

  const handleVideoUpload = async (e) => {
    console.log('🎬 handleVideoUpload called');
    const file = e.target.files[0];
    if (file) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log('📹 Video file selected:', file.name, 'Size:', fileSizeMB, 'MB');
      
      // Validate file size (max 200MB for production stability)
      const maxSize = 200 * 1024 * 1024; // 200MB
      if (file.size > maxSize) {
        showMessage('error', `❌ Video file bohot bari hai!\n\nMaximum size: 200MB\nAapki file: ${fileSizeMB}MB\n\n⚠️ Production server large files handle nahi kar sakta.\nPehle video compress karein:\n• Handbrake software use karein\n• Online compressor: videosmaller.com\n• Target size: 50-150MB`);
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Warning for large files
      if (file.size > 100 * 1024 * 1024) {
        if (!confirm(`⚠️ IMPORTANT WARNING ⚠️\n\nVideo size: ${fileSizeMB}MB\n\nUpload mein 5-10 minutes lag sakte hain.\n\nKRIPYA:\n✓ Stable WiFi/Ethernet connection use karein\n✓ Browser window BAND MAT KAREIN\n✓ Laptop charging me laga len\n✓ Koi aur download/upload na karein\n\nContinue karein?`)) {
          e.target.value = '';
          return;
        }
      }
      
      setUploadedVideo(file);
      setLoading(true); // Show loading during upload
      
      // Upload immediately
      const formData = new FormData();
      formData.append('video', file);
      if (adminId) {
        formData.append('admin_id', adminId);
      } else {
        showMessage('error', 'Admin ID missing hai. Dobara login karein.');
        setLoading(false);
        return;
      }
      
      try {
        const uploadUrl = `${API_URL}/counter-display/upload-video`;
        console.log('📤 Uploading video to:', uploadUrl);
        console.log('📦 File size:', fileSizeMB, 'MB');
        console.log('🔑 Token:', getToken() ? 'Present' : 'Missing');
        console.log('🌐 API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
        showMessage('info', `🔄 Uploading ${fileSizeMB}MB video... Please wait (5-10 minutes)`);
        
        // Calculate timeout based on file size (3 minutes per 30MB, minimum 15 minutes for production)
        const timeoutMs = Math.max(900000, Math.ceil(file.size / (30 * 1024 * 1024)) * 180000);
        console.log('⏱️ Upload timeout set to:', (timeoutMs / 60000).toFixed(1), 'minutes');
        
        // IMPORTANT: Use environment variable directly to ensure production URL
        const productionApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://queapi.techmanagement.tech/api';
        const finalUploadUrl = `${productionApiUrl}/counter-display/upload-video`;
        
        console.log('🎯 Final upload URL:', finalUploadUrl);
        
        // Use raw axios to avoid interceptor issues with large files
        const token = getToken();
        
        if (!token) {
          showMessage('error', '❌ Authentication token missing. Please login again.');
          setLoading(false);
          setUploadedVideo(null);
          e.target.value = '';
          return;
        }
        
        const response = await axiosRaw.post(finalUploadUrl, formData, {
          timeout: timeoutMs,
          headers: { 
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type, let browser set it with boundary
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Don't throw for 4xx errors
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('📊 Upload progress:', percentCompleted + '%');
            // Show progress updates every 10%
            if (percentCompleted % 10 === 0) {
              showMessage('info', `⏳ Upload: ${percentCompleted}% - Browser window BAND MAT KAREIN!`);
            }
          }
        });
        
        console.log('📥 Server response status:', response.status);
        console.log('📥 Server response data:', response.data);
        
        if (response.status === 200 && response.data.success) {
          setVideoUrl(response.data.videoUrl);
          showMessage('success', '✅ Video successfully upload ho gaya!');
          console.log('✅ Video uploaded:', response.data.videoUrl);
        } else {
          // Handle non-200 status or success: false
          const errorMsg = response.data?.message || `Upload failed with status ${response.status}`;
          showMessage('error', `❌ ${errorMsg}`);
          setUploadedVideo(null);
          e.target.value = '';
        }
      } catch (error) {
        console.error('❌ Error uploading video:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        let errorMessage = '❌ Video upload fail ho gaya';
        
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          errorMessage = `🔴 NETWORK ERROR\n\nVideo size: ${fileSizeMB}MB\nBackend tak request nahi pahunchi\n\n🔍 POSSIBLE CAUSES:\n1. Backend server down ho sakta hai\n2. CORS configuration issue\n3. Nginx/Server timeout\n4. Internet connection lost\n5. File size backend accept nahi kar raha\n\n✅ SOLUTIONS:\n1. Backend logs check karein (PM2)\n2. Video compress karke 50-100MB karein\n3. Stable internet connection\n4. Server restart karein\n\n📞 Tech team ko batain!`;
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = `⏱️ TIMEOUT ERROR\n\nUpload time: ${(timeoutMs/60000).toFixed(1)} minutes\nFile size: ${fileSizeMB}MB\n\n❌ Server ne response nahi diya!\n\n✅ SOLUTIONS:\n1. Video compress karein (target: 50-100MB)\n2. Backend timeout settings check karein\n3. Nginx timeout increase karein\n4. Faster internet connection use karein`;
        } else if (error.response?.status === 413) {
          errorMessage = `📦 FILE TOO LARGE (413)\n\nFile: ${fileSizeMB}MB\nServer limit: Exceeded\n\n✅ SOLUTIONS:\n1. Video compress karke 100MB se kam karein\n2. Backend limit check: body-parser & multer\n3. Nginx client_max_body_size setting`;
        } else if (error.response?.status === 401) {
          errorMessage = `🔒 AUTHENTICATION ERROR (401)\n\nToken expired ya invalid hai.\n\n✅ SOLUTION:\nDobara login karein`;
        } else if (error.response?.status === 500) {
          errorMessage = `⚠️ SERVER ERROR (500)\n\nBackend me error aya.\n\n✅ SOLUTION:\n1. Backend logs check karein\n2. PM2 restart karein\n3. Tech team ko batain`;
        } else if (error.response?.data?.message) {
          errorMessage = `❌ ${error.response.data.message}`;
        }
        
        showMessage('error', errorMessage);
        setUploadedVideo(null);
        e.target.value = ''; // Reset file input
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLeftLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ Left logo selected:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file');
        return;
      }
      
      setLeftLogo(file);
      
      // Upload immediately
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('logoType', 'left');
      if (adminId) {
        formData.append('admin_id', adminId);
      } else {
        showMessage('error', 'Admin ID is missing. Please login again.');
        return;
      }
      
      try {
        const uploadUrl = `${API_URL}/counter-display/upload-logo`;
        console.log('📤 Uploading left logo to:', uploadUrl);
        const response = await axios.post(uploadUrl, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        });
        
        if (response.data.success) {
          setLeftLogoUrl(response.data.logoUrl);
          showMessage('success', 'Left logo uploaded successfully');
          console.log('✅ Left logo uploaded:', response.data.logoUrl);
        }
      } catch (error) {
        console.error('❌ Error uploading left logo:', error);
        console.error('Error response:', error.response?.data);
        showMessage('error', error.response?.data?.message || 'Failed to upload left logo');
      }
    }
  };

  const handleRightLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ Right logo selected:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file');
        return;
      }
      
      setRightLogo(file);
      
      // Upload immediately
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('logoType', 'right');
      if (adminId) {
        formData.append('admin_id', adminId);
      } else {
        showMessage('error', 'Admin ID is missing. Please login again.');
        return;
      }
      
      try {
        const uploadUrl = `${API_URL}/counter-display/upload-logo`;
        console.log('📤 Uploading right logo to:', uploadUrl);
        const response = await axios.post(uploadUrl, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        });
        
        if (response.data.success) {
          setRightLogoUrl(response.data.logoUrl);
          showMessage('success', 'Right logo uploaded successfully');
          console.log('✅ Right logo uploaded:', response.data.logoUrl);
        }
      } catch (error) {
        console.error('❌ Error uploading right logo:', error);
        console.error('Error response:', error.response?.data);
        showMessage('error', error.response?.data?.message || 'Failed to upload right logo');
      }
    }
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      console.log('🖼️ Images selected:', files.length, 'files');
      
      // Validate file types
      const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        showMessage('error', 'Please select only image files');
        return;
      }
      
      // Upload images to server
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      if (adminId) {
        formData.append('admin_id', adminId);
      } else {
        showMessage('error', 'Admin ID is missing. Please login again.');
        return;
      }
      
      try {
        const uploadUrl = `${API_URL}/counter-display/upload-images`;
        console.log('📤 Uploading images to:', uploadUrl);
        const response = await axios.post(uploadUrl, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        });
        
        if (response.data.success) {
          const uploadedImages = response.data.images.map(img => ({
            id: img.id,
            preview: `${process.env.NEXT_PUBLIC_API_URL_WS}${img.imageUrl}`,
            name: img.imageName,
            file: null
          }));
          
          setSliderImages([...sliderImages, ...uploadedImages]);
          showMessage('success', `${uploadedImages.length} images uploaded successfully`);
          console.log('✅ Images uploaded:', uploadedImages.length);
        }
      } catch (error) {
        console.error('❌ Error uploading images:', error);
        console.error('Error response:', error.response?.data);
        showMessage('error', error.response?.data?.message || 'Failed to upload images');
      }
    }
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  const handleUpdateContent = async () => {
    setLoading(true);
    
    // Validate before updating
    if (!adminId) {
      showMessage('error', 'Admin ID is missing. Please login again.');
      setLoading(false);
      return;
    }
    
    if (contentType === 'video' && !videoUrl) {
      showMessage('error', 'Please upload a video first');
      setLoading(false);
      return;
    }
    
    if (contentType === 'images' && selectedImages.length === 0) {
      showMessage('error', 'Please select at least one image for the slider');
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        leftLogoUrl,
        rightLogoUrl,
        screenType,
        contentType,
        videoUrl,
        sliderTimer,
        tickerContent,
        selectedImageIds: selectedImages,
        admin_id: adminId
      };

      const updateUrl = `${API_URL}/counter-display/config`;
      console.log('💾 Updating config at:', updateUrl, 'Payload:', payload);
      const response = await axios.post(updateUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.data.success) {
        showMessage('success', 'Configuration updated successfully!');
        console.log('✅ Configuration updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      console.error('Error response:', error.response?.data);
      showMessage('error', error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Counter Display Management</h1>
      
      {/* Success/Error/Info Message */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border-2 border-green-500 text-green-700' 
            : message.type === 'info' 
            ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
            : 'bg-red-100 border-2 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : message.type === 'info' ? (
              <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        </div>
      )}
      
  

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full my-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Ticket Info User
                </h3>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setNewUserData({ username: '', email: '', password: '' });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTicketInfoUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Enter password"
                  required
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setNewUserData({ username: '', email: '', password: '' });
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Row: Left Logo, Right Logo, Screen Type */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
            Left Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLeftLogoUpload}
            className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          {(leftLogo || leftLogoUrl) && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <img 
                src={leftLogo ? URL.createObjectURL(leftLogo) : `${process.env.NEXT_PUBLIC_API_URL_WS}${leftLogoUrl}`} 
                alt="Left Logo" 
                className="h-12 object-contain mx-auto"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
            Right Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleRightLogoUpload}
            className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          {(rightLogo || rightLogoUrl) && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <img 
                src={rightLogo ? URL.createObjectURL(rightLogo) : `${process.env.NEXT_PUBLIC_API_URL_WS}${rightLogoUrl}`} 
                alt="Right Logo" 
                className="h-12 object-contain mx-auto"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
            Screen Type
          </label>
          <select
            value={screenType}
            onChange={(e) => setScreenType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700 text-sm"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Current: <span className="font-semibold text-green-600">{screenType}</span>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Display Link:</p>
            <a 
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/ticket_info_${screenType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all font-medium"
            >
              {typeof window !== 'undefined' ? window.location.origin : ''}/ticket_info_{screenType}
            </a>
          </div>
        </div>
      </div>
          {/* Ticket Info Users Management Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-5 mb-6 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ticket Info Users Management
            </h2>
            <p className="text-sm text-green-600 mt-1">Create and manage ticket_info screen users</p>
          </div>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New User
          </button>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg p-4">
          {ticketInfoUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">No ticket_info users created yet</p>
              <p className="text-sm">Click "Create New User" to add your first user</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ticketInfoUsers.map((user) => (
                <div key={user.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{user.username}</h3>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                          ticket_info
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTicketInfoUser(user.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete User"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-5 mb-6 border-2 border-green-200">
        <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Select Content Type:
        </label>
        <div className="flex gap-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="contentType"
              value="video"
              checked={contentType === 'video'}
              onChange={(e) => handleContentTypeChange(e.target.value)}
              className="w-6 h-6 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <span className={`text-lg font-semibold transition-all flex items-center gap-2 ${
              contentType === 'video' 
                ? 'text-green-700 scale-105' 
                : 'text-gray-600 group-hover:text-green-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </span>
            {contentType === 'video' && (
              <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full animate-pulse">
                Active
              </span>
            )}
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="contentType"
              value="images"
              checked={contentType === 'images'}
              onChange={(e) => handleContentTypeChange(e.target.value)}
              className="w-6 h-6 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <span className={`text-lg font-semibold transition-all flex items-center gap-2 ${
              contentType === 'images' 
                ? 'text-green-700 scale-105' 
                : 'text-gray-600 group-hover:text-green-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Images Slider
            </span>
            {contentType === 'images' && (
              <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full animate-pulse">
                Active
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Main Content Area: Conditional Rendering based on Content Type */}
      <div className="flex gap-4 mb-4">
        {/* Video Section - Only show when contentType is 'video' */}
        {contentType === 'video' && (
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-3">
            Upload Video (Maximum: 500MB, Recommended: 50-300MB)
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={sliderImages.length > 0}
            className={`w-full text-sm text-gray-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50 ${
              sliderImages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          {sliderImages.length > 0 && (
            <div className="mb-2 text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Remove images to upload video
            </div>
          )}
          
          {/* Video Preview Box */}
          <div className="border-4 border-dashed border-gray-300 rounded-lg h-80 flex items-center justify-center bg-gray-50">
            {(uploadedVideo || videoUrl) ? (
              <video 
                src={uploadedVideo ? URL.createObjectURL(uploadedVideo) : `${process.env.NEXT_PUBLIC_API_URL_WS}${videoUrl}`}
                controls 
                className="max-h-full max-w-full rounded"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="text-center text-gray-400">
                <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Video Preview</p>
                <p className="text-sm">Upload a video to see preview</p>
                {sliderImages.length > 0 && (
                  <p className="text-xs text-amber-500 mt-2">Video disabled (images selected)</p>
                )}
              </div>
            )}
          </div>
        </div>
        )}


        {/* Image Section - Only show when contentType is 'images' */}
        {contentType === 'images' && (
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Image Slider Configuration
          </h2>
          
          {/* Timer Input & Upload Images - Same Row */}
          <div className="flex gap-4 mb-4">
            {/* Timer Dropdown - Smaller Width */}
            <div className="w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Slider Timer
              </label>
              <select
                value={sliderTimer}
                onChange={(e) => setSliderTimer(Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700 font-semibold bg-white cursor-pointer"
              >
                <option value={1}>1 second</option>
                <option value={2}>2 seconds</option>
                <option value={3}>3 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={6}>6 seconds</option>
                <option value={7}>7 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={9}>9 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>

            {/* Upload Images Button - Takes Remaining Space */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-2 file:border-green-300 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                Select multiple files
              </p>
            </div>
          </div>

          {/* Images Preview Grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Uploaded Images ({sliderImages.length})
            </label>
            <div className="border-4 border-dashed border-green-300 rounded-lg h-96 overflow-y-auto bg-green-50/30 p-4">
              {sliderImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="h-20 w-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xl font-medium text-gray-500">No images uploaded</p>
                  <p className="text-sm text-gray-400 mt-1">Upload images to create your slider</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {sliderImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => toggleImageSelection(image.id)}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-3 transition-all transform hover:scale-105 ${
                        selectedImages.includes(image.id)
                          ? 'border-green-600 ring-4 ring-green-300 shadow-lg'
                          : 'border-gray-300 hover:border-green-400 shadow-md'
                      }`}
                    >
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-32 object-cover"
                      />
                      {selectedImages.includes(image.id) && (
                        <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                          <div className="bg-green-600 text-white rounded-full p-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {selectedImages.length > 0 && (
            <div className="mt-3 p-3 text-center bg-green-100 rounded-lg border-2 border-green-400">
              <span className="text-green-700 font-bold text-lg flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {selectedImages.length} image(s) selected for slider
              </span>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Bottom: Ticker Content */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
          Ticker Content
        </label>
        <input
          type="text"
          value={tickerContent}
          onChange={(e) => setTickerContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-700"
        />
      </div>

      {/* Update Button */}
      <div className="text-center">
        <button
          onClick={handleUpdateContent}
          disabled={loading}
          className={`px-12 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-lg flex items-center gap-2 mx-auto ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            'Update Content'
          )}
        </button>
      </div>
    </div>
  );
}
