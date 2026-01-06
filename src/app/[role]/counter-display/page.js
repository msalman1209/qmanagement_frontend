'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosInstance';
import axiosRaw from 'axios'; // Raw axios for file uploads
import { getToken, getUser } from '@/utils/sessionStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



// ❌ DON'T use getApiUrl() at module level - it runs during SSR when window is undefined
// ✅ SOLUTION: Use state and set URL in useEffect after component mounts on client

export default function CounterDisplayPage({ adminId: propAdminId }) {
  const router = useRouter();
  // Get current user from session
  const currentUser = getUser();
  
  // ✅ API_URL as state - will be set on client side
  const [API_URL, setAPI_URL] = useState('');
  
  // Set API_URL on component mount (client side only)
  useEffect(() => {
    console.log('🔍 DEBUGGING API_URL INITIALIZATION:');
    console.log('   - window.location.hostname:', window.location.hostname);
    console.log('   - window.location.href:', window.location.href);
    console.log('   - Is localhost?', window.location.hostname === 'localhost');
    
    // On production (non-localhost), always use production URL
    if (window.location.hostname !== 'localhost') {
      const productionUrl = 'https://queapi.techmanagement.tech/api';
      setAPI_URL(productionUrl);
      console.log('✅ PRODUCTION MODE - API_URL set to:', productionUrl);
      console.log('   - Upload URL will be:', productionUrl + '/counter-display/upload-video');
    } else {
      // On localhost, use environment variable or fallback
      const localUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      setAPI_URL(localUrl);
      console.log('✅ LOCAL MODE - API_URL set to:', localUrl);
      console.log('   - Upload URL will be:', localUrl + '/counter-display/upload-video');
    }
  }, []);
  
  // ✅ Use adminId from prop OR from logged-in user's session
  const [adminId, setAdminId] = useState(null);
  
  useEffect(() => {
    console.log('🔍 [counter-display] ADMIN ID DETECTION:');
    console.log('🔍 [counter-display] propAdminId:', propAdminId);
    console.log('🔍 [counter-display] propAdminId type:', typeof propAdminId);
    console.log('🔍 [counter-display] currentUser:', JSON.stringify(currentUser, null, 2));
    
    if (propAdminId) {
      setAdminId(propAdminId);
      console.log('✅ [counter-display] Using admin_id from prop:', propAdminId);
    } else if (currentUser && currentUser.admin_id) {
      setAdminId(currentUser.admin_id);
      console.log('✅ [counter-display] Using admin_id from logged-in user:', currentUser.admin_id);
    } else if (currentUser && currentUser.id && currentUser.role === 'admin') {
      // If logged in user is admin, use their ID as admin_id
      setAdminId(currentUser.id);
      console.log('✅ [counter-display] Logged in user IS the admin, using user.id as admin_id:', currentUser.id);
    } else {
      console.error('❌ [counter-display] No admin_id found - currentUser:', currentUser);
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
  
  // Both User Display (automatically created with license)
  const [ticketInfoUsers, setTicketInfoUsers] = useState([]);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
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
    
    // ✅ Only fetch if adminId AND API_URL are available
    if (adminId && API_URL) {
      fetchConfiguration();
      fetchTicketInfoUsers();
    }
  }, [adminId, API_URL]); // Added API_URL dependency

  const fetchConfiguration = async () => {
    try {
      // ✅ Always require adminId and API_URL
      if (!adminId) {
        console.error('❌ No adminId available - cannot fetch configuration');
        return;
      }
      
      if (!API_URL) {
        console.error('❌ API_URL not initialized yet');
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
      toast.error('Failed to load configuration!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Fetch Both User (automatically created with license)
  const fetchTicketInfoUsers = async () => {
    try {
      // ✅ Always require adminId
      if (!adminId) {
        console.warn('⚠️ Admin ID not available for fetching both user');
        return;
      }
      
      if (!API_URL) {
        console.warn('⚠️ API_URL not initialized yet');
        return;
      }
      
      const url = `${API_URL}/user/ticket-info-users?adminId=${adminId}`;
      console.log('📡 Fetching both user from:', url);
      console.log('📋 Current adminId:', adminId);
      console.log('📋 Current API_URL:', API_URL);
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      
      console.log('📦 Full Response:', response.data);
      
      if (response.data.success) {
        // Show ALL users - backend already filters correctly
        const allUsers = response.data.users || [];
        setTicketInfoUsers(allUsers);
        console.log('✅ Fetched', allUsers.length, 'user(s)');
        console.log('👥 Users data:', JSON.stringify(allUsers, null, 2));
        
        // Filter both_user specifically for display
        const bothUsers = allUsers.filter(user => 
          user.role && (
            user.role.includes('receptionist,ticket_info') || 
            user.role.includes('ticket_info,receptionist')
          )
        );
        console.log('🎯 Both users found:', bothUsers.length);
        console.log('🎯 Both users details:', JSON.stringify(bothUsers, null, 2));
      } else {
        console.error('❌ Response not successful:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching both user:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error message:', error.message);
    }
  };



  // Open Edit Modal
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      password: '' // Empty for security
    });
    setShowEditUserModal(true);
  };

  // Update User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!editUserData.username || !editUserData.email) {
      toast.error('❌ Username and email are required!', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    try {
      const updateData = {
        username: editUserData.username,
        email: editUserData.email
      };
      
      // Only include password if it's been changed
      if (editUserData.password && editUserData.password.trim() !== '') {
        updateData.password = editUserData.password;
      }

      const url = `${API_URL}/user/${editingUser.id}`;
      console.log('📝 Updating user at:', url);
      const response = await axios.put(url, updateData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.data.success) {
        toast.success('✅ Both user updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowEditUserModal(false);
        setEditingUser(null);
        setEditUserData({ username: '', email: '', password: '' });
        fetchTicketInfoUsers();
        console.log('✅ User updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      console.error('Error response:', error.response?.data);
      
      // ✅ Show backend error message directly to user
      let errorMessage = '❌ Failed to update user!';
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        
        // Check if it's a duplicate error from backend
        if (backendMessage.includes('username is already taken')) {
          errorMessage = '❌ ' + backendMessage + '\n\n📝 Please enter a different username.';
        }
        else if (backendMessage.includes('email is already registered')) {
          errorMessage = '❌ ' + backendMessage + '\n\n📧 Please use a different email address.';
        }
        else if (backendMessage.includes('Username or email is already in use')) {
          errorMessage = '❌ ' + backendMessage + '\n\n📝 Please check both fields and change the duplicate one.';
        }
        else {
          // Show any other backend message
          errorMessage = '❌ ' + backendMessage;
        }
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          whiteSpace: 'pre-line',
          fontSize: '15px',
          fontWeight: '500'
        }
      });
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
        toast.error(`❌ Video file is too large!\n\nMaximum size: 200MB\nYour file: ${fileSizeMB}MB\n\n⚠️ Production server cannot handle large files.\nPlease compress video first:\n• Use Handbrake software\n• Online compressor: videosmaller.com\n• Target size: 50-150MB`, {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Warning for large files
      if (file.size > 100 * 1024 * 1024) {
        if (!confirm(`⚠️ IMPORTANT WARNING ⚠️\n\nVideo size: ${fileSizeMB}MB\n\nUpload may take 5-10 minutes.\n\nPLEASE:\n✓ Use stable WiFi/Ethernet connection\n✓ DO NOT CLOSE browser window\n✓ Keep laptop plugged in\n✓ Avoid other downloads/uploads\n\nContinue?`)) {
          e.target.value = '';
          return;
        }
      }
      
      // ✅ SIRF FILE STORE KARO - Upload nahi karo
      setUploadedVideo(file);
      toast.success(`✅ Video selected: ${file.name} (${fileSizeMB}MB)\n\nClick "Update Content" button to upload.`, {
        position: "top-right",
        autoClose: 3000
      });
      console.log('✅ Video file ready for upload on "Update Content" click');
    }
  };

  const handleLeftLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ Left logo selected:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
          toast.success('Left logo uploaded successfully', {
            position: "top-right",
            autoClose: 3000
          });
          console.log('✅ Left logo uploaded:', response.data.logoUrl);
        }
      } catch (error) {
        console.error('❌ Error uploading left logo:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to upload left logo', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
      }
    }
  };

  const handleRightLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ Right logo selected:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
        toast.error('Admin ID is missing. Please login again.', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
          toast.success('Right logo uploaded successfully', {
            position: "top-right",
            autoClose: 3000
          });
          console.log('✅ Right logo uploaded:', response.data.logoUrl);
        }
      } catch (error) {
        console.error('❌ Error uploading right logo:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to upload right logo', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
        toast.error('Please select only image files', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
        toast.error('Admin ID is missing. Please login again.', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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
          toast.success(`${uploadedImages.length} images uploaded successfully`, {
            position: "top-right",
            autoClose: 3000
          });
          console.log('✅ Images uploaded:', uploadedImages.length);
        }
      } catch (error) {
        console.error('❌ Error uploading images:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to upload images', {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { whiteSpace: 'pre-line' }
        });
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

  // Delete image handler
  const handleDeleteImage = async (imageId, imageName) => {
    if (!confirm(`Are you sure you want to delete "${imageName}"?`)) {
      return;
    }

    try {
      const deleteUrl = `${API_URL}/counter-display/image/${imageId}`;
      console.log('🗑️ Deleting image:', deleteUrl);
      
      const response = await axios.delete(deleteUrl, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        // Remove from state
        setSliderImages(sliderImages.filter(img => img.id !== imageId));
        setSelectedImages(selectedImages.filter(id => id !== imageId));
        
        toast.success('Image deleted successfully!', {
          position: "top-right",
          autoClose: 3000
        });
        console.log('✅ Image deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Failed to delete image', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  // Delete video handler
  const handleDeleteVideo = async () => {
    if (!confirm('Are you sure you want to remove the video?')) {
      return;
    }

    try {
      // If there's a saved video URL, delete it from backend
      if (videoUrl) {
        const deleteUrl = `${API_URL}/counter-display/delete-video`;
        console.log('🗑️ Deleting video from server');
        
        await axios.post(deleteUrl, 
          { admin_id: adminId },
          { headers: getAuthHeaders() }
        );
      }

      // Clear from state
      setUploadedVideo(null);
      setVideoUrl('');
      
      toast.success('Video removed successfully!', {
        position: "top-right",
        autoClose: 3000
      });
      console.log('✅ Video removed');
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      toast.error(error.response?.data?.message || 'Failed to delete video', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const handleUpdateContent = async () => {
    setLoading(true);
    
    // Validate before updating
    if (!adminId) {
      toast.error('Admin ID is missing. Please login again.', {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { whiteSpace: 'pre-line' }
      });
      setLoading(false);
      return;
    }
    
    if (contentType === 'video' && !videoUrl && !uploadedVideo) {
      toast.error('Please upload a video first', {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { whiteSpace: 'pre-line' }
      });
      setLoading(false);
      return;
    }
    
    if (contentType === 'images' && selectedImages.length === 0) {
      toast.error('Please select at least one image for the slider', {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { whiteSpace: 'pre-line' }
      });
      setLoading(false);
      return;
    }
    
    try {
      let finalVideoUrl = videoUrl;
      
      // ✅ STEP 1: Upload video if a new one is selected
      if (uploadedVideo) {
        toast.info('⏳ Video is uploading... Please wait...', {
          position: "top-right",
          autoClose: false
        });
        console.log('📤 Starting video upload...');
        
        const formData = new FormData();
        formData.append('video', uploadedVideo);
        formData.append('admin_id', adminId);
        
        const uploadUrl = `${API_URL}/counter-display/upload-video`;
        console.log('📤 Uploading video to:', uploadUrl);
        
        // Use raw axios for file upload with progress tracking
        const uploadResponse = await axiosRaw.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          },
          timeout: 600000, // 10 minutes timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Upload progress: ${percentCompleted}%`);
            if (percentCompleted % 10 === 0) {
              toast.info(`⏳ Upload progress: ${percentCompleted}%`, {
                position: "top-right",
                autoClose: false
              });
            }
          }
        });
        
        if (uploadResponse.data.success) {
          finalVideoUrl = uploadResponse.data.videoUrl;
          console.log('✅ Video uploaded successfully:', finalVideoUrl);
          toast.success('✅ Video upload successful!', {
            position: "top-right",
            autoClose: 3000
          });
          setVideoUrl(finalVideoUrl);
          setUploadedVideo(null); // Clear the file after upload
        } else {
          throw new Error(uploadResponse.data.message || 'Video upload failed');
        }
      }
      
      // ✅ STEP 2: Update configuration
      toast.info('💾 Configuration is being saved...', {
        position: "top-right",
        autoClose: false
      });
      const payload = {
        leftLogoUrl,
        rightLogoUrl,
        screenType,
        contentType,
        videoUrl: finalVideoUrl,
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
        toast.success('✅ Configuration updated successfully!', {
          position: "top-right",
          autoClose: 3000
        });
        console.log('✅ Configuration updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update configuration', {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { whiteSpace: 'pre-line' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Counter Display Management</h1>
      
      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Both User
                </h3>
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setEditUserData({ username: '', email: '', password: '' });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                  className="w-full px-4 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-gray-500"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-gray-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (Optional)</label>
                <input
                  type="password"
                  value={editUserData.password}
                  onChange={(e) => setEditUserData({...editUserData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-gray-500"
                  placeholder="Leave empty to keep current password"
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password. Minimum 6 characters if changing.</p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">⚠️ Note:</span> This user can login to both Receptionist and Ticket Info screens with updated credentials.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setEditUserData({ username: '', email: '', password: '' });
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


      {/* Top Row: Left Logo, Right Logo, Screen Type */
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

      /* Both User Display Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-5 mb-6 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Both User (Dual Role Access)
            </h2>
            <p className="text-sm text-green-600 mt-1">Automatically created user with receptionist & ticket_info access</p>
          </div>
          <div className="bg-green-100 px-4 py-2 rounded-lg border-2 border-green-300">
            <p className="text-xs text-green-700 font-semibold">Auto-Generated with License</p>
          </div>
        </div>

        {/* Both User Display */}
        <div className="bg-white rounded-lg p-4">
          {ticketInfoUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-lg font-medium">No both_user found</p>
              <p className="text-sm">Both user is automatically created when license is created</p>
              <p className="text-xs text-gray-400 mt-2">Default password: QueUser123!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketInfoUsers.map((user) => (
                <div key={user.id} className="relative border-2 border-green-300 rounded-lg p-5 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="absolute top-3 right-3 p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Edit User"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-3 mb-3 pr-10">
                    {/* <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {user.username?.charAt(0).toUpperCase()}
                    </div> */}
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{user.username}</h3>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold border border-blue-300">
                        📋 receptionist
                      </span>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold border border-green-300">
                        📺 ticket_info
                      </span>
                    </div>
                    {/* <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">🔑 Default Password:</span>
                        <code className="ml-1 px-2 py-0.5 bg-yellow-100 rounded text-yellow-800 font-mono">QueUser123!</code>
                      </p>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        {/* <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">ℹ️ About Both User:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Automatically created when license is created</li>
                <li>Can login to both Receptionist and Ticket Info screens</li>
                <li>Email format: <code className="bg-blue-100 px-1 rounded">{'{admin}.user@{company}.com'}</code></li>
                <li>Default password: <code className="bg-blue-100 px-1 rounded font-semibold">QueUser123!</code></li>
                <li>Cannot be deleted (system user)</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Content Type Selection Section */}
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
          <div className="border-4 border-dashed border-gray-300 rounded-lg h-80 flex items-center justify-center bg-gray-50 relative">
            {(uploadedVideo || videoUrl) ? (
              <>
                <video 
                  src={uploadedVideo ? URL.createObjectURL(uploadedVideo) : `${process.env.NEXT_PUBLIC_API_URL_WS}${videoUrl}`}
                  controls 
                  className="max-h-full max-w-full rounded"
                >
                  Your browser does not support video playback.
                </video>
                <button
                  onClick={handleDeleteVideo}
                  className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
                  title="Delete Video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
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
                      className="relative rounded-lg overflow-hidden border-3 transition-all transform hover:scale-105 shadow-md"
                    >
                      <div
                        onClick={() => toggleImageSelection(image.id)}
                        className={`cursor-pointer ${
                          selectedImages.includes(image.id)
                            ? 'ring-4 ring-green-300'
                            : ''
                        }`}
                      >
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-32 object-cover"
                        />
                        {selectedImages.includes(image.id) && (
                          <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center pointer-events-none">
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
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id, image.name);
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
                        title="Delete Image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
      
      <ToastContainer />
    </div>
  );
}
