'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { setLicenses, removeLicense, selectLicenses } from '@/store/slices/licenseSlice';
import { getToken } from '@/utils/sessionStorage';

// Import actual components from their routes
import CreateServicesPage from '@/app/[role]/services/create-services/page';
import AssignServicesPage from '@/app/[role]/services/assign-services/page';
import ReportsPage from '@/app/[role]/reports/page';
import ConfigurationPage from '@/app/[role]/configuration/page';
import CounterDisplayPage from '@/app/[role]/counter-display/page';
import CreateAdminPage from '@/app/[role]/users/create-admin/page';
import DisplayScreensSessionsPage from '@/app/[role]/display-screens-sessions/page';
import UserDashboardBtnsPage from '@/app/[role]/user-dashboard-btns/page';
import UserSessionsPage from '@/app/[role]/users/user&sessions/page';
import ProfilePage from '@/app/[role]/profile/page';
import DashboardPage from '@/app/[role]/dashboard/page';
import CompletedTasksPage from '@/app/[role]/completed-tasks/page';
import CreateLicensePage from '@/app/[role]/license/create-license/page';
import LicenseReportPage from '@/app/[role]/license/license-report/page';
import DetailsReportsPage from '@/app/[role]/reports/details-reports/page';
import ShortReportsPage from '@/app/[role]/reports/short-reports/page';
import ActivityLogsPage from '@/app/[role]/activity-logs/page';

// Backup & Restore Component
function BackupRestorePage({ adminId }) {
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (adminId) {
      fetchBackupHistory();
    }
  }, [adminId]);

  const fetchBackupHistory = async () => {
    try {
      setLoadingHistory(true);
      const authToken = token || getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/history/${adminId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBackupHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching backup history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.sql')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid SQL backup file');
        e.target.value = '';
      }
    }
  };

  const handleBackupRestore = async () => {
    if (!selectedFile) {
      alert('Please select a backup file');
      return;
    }

    if (!confirm('Are you sure you want to restore this backup? This will update all data for this admin.')) {
      return;
    }

    try {
      setRestoring(true);
      const authToken = token || getToken();
      const formData = new FormData();
      formData.append('backupFile', selectedFile);
      formData.append('adminId', adminId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup restored successfully!');
        setSelectedFile(null);
        document.getElementById('fileInput').value = '';
        fetchBackupHistory();
      } else {
        alert(data.message || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setUploading(true);
      const authToken = token || getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/create/${adminId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `backup_admin_${adminId}_${new Date().toISOString().split('T')[0]}.sql`;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Download the SQL file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('SQL Backup created and downloaded successfully!');
        fetchBackupHistory();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Backup & Restore</h2>
        
        {/* Create Backup Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create New Backup
          </h3>
          <p className="text-gray-600 mb-4">Create a complete backup of all data for Admin ID: {adminId}</p>
          <button
            onClick={handleCreateBackup}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Backup...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Backup
              </>
            )}
          </button>
        </div>

        {/* Restore Backup Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Restore from Backup
          </h3>
          <p className="text-gray-600 mb-4">Upload a backup file to restore data for Admin ID: {adminId}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">Select Backup File (SQL)</label>
            <input
              id="fileInput"
              type="file"
              accept=".sql"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {selectedFile.name} selected
              </p>
            )}
          </div>

          <button
            onClick={handleBackupRestore}
            disabled={!selectedFile || restoring}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {restoring ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Restoring...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Restore Backup
              </>
            )}
          </button>
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Backup History
          </h3>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : backupHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No backup history found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-black">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-black">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backupHistory.map((backup, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">{new Date(backup.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-black">{backup.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${backup.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {backup.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListOfLicensePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector((state) => state.auth.token);
  const licenses = useSelector(selectLicenses);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminDetails, setAdminDetails] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('create-services');
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [panelType, setPanelType] = useState('admin'); // 'admin' or 'user'

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const authToken = token || getToken();
      console.log('Fetching licenses with token:', authToken ? 'Token exists' : 'No token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/all`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Setting licenses:', data.data?.length || 0, 'items');
        dispatch(setLicenses(data.data || []));
      } else {
        console.error('API returned success=false:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this license?')) return;

    try {
      const authToken = token || getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (data.success) {
        dispatch(removeLicense(id));
        alert('License deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete license');
      }
    } catch (error) {
      console.error('Error deleting license:', error);
      alert('Failed to delete license. Please try again.');
    }
  };

  const fetchAdminDetails = async (adminId) => {
    try {
      setLoadingAdmin(true);
      const authToken = token || getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/admin/${adminId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdminDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin details:', error);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleAdminClick = (license) => {
    console.log('🔍 [handleAdminClick] License object:', license);
    console.log('🔍 [handleAdminClick] admin_id:', license.admin_id);
    console.log('🔍 [handleAdminClick] All keys:', Object.keys(license));
    setSelectedAdmin(license);
    setShowAdminModal(true);
    setActiveTab('create-services');
    setServicesDropdownOpen(false);
    setReportsDropdownOpen(false);
    setPanelType('admin'); // Reset to admin panel
    fetchAdminDetails(license.admin_id);
  };

  const getStatusBadge = (license) => {
    if (license.license_status === 'expired') {
      return <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Expired</span>;
    } else if (license.days_remaining <= 7) {
      return <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Expiring Soon</span>;
    } else {
      return <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
    }
  };

  const getLicenseTypeBadge = (type) => {
    const typeColors = {
      'basic': 'bg-gray-100 text-gray-800',
      'premium': 'bg-purple-100 text-purple-800',
      'enterprise': 'bg-blue-100 text-blue-800',
      'trial': 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const filteredLicenses = (licenses || []).filter(license => {
    const matchesSearch = license.license_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || license.license_type === filterType;
    const matchesStatus = filterStatus === 'all' || license.license_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black mb-2">License Management</h1>
        <p className="text-gray-500">Manage and monitor all system licenses</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Search</label>
            <input
              type="text"
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            >
              <option value="all">All Types</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">License Key</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No licenses found
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono font-semibold text-black">{license.license_key}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleAdminClick(license)}
                        className="text-left hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      >
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">{license.admin_name}</div>
                        <div className="text-xs text-gray-500">ID: {license.admin_id}</div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">{license.company_name}</div>
                      {license.city && <div className="text-xs text-gray-500">{license.city}, {license.country}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {getLicenseTypeBadge(license.license_type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">{new Date(license.expiry_date).toLocaleDateString()}</div>
                      {license.days_remaining >= 0 && (
                        <div className="text-xs text-gray-500">{license.days_remaining} days left</div>
                      )}
                      {license.days_remaining < 0 && (
                        <div className="text-xs text-red-500">Expired {Math.abs(license.days_remaining)} days ago</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(license)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAdminModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {console.log('🔍 [Modal Render] selectedAdmin:', selectedAdmin)}
            {console.log('🔍 [Modal Render] selectedAdmin.admin_id:', selectedAdmin?.admin_id)}
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center">
                <div className="text-white flex-1">
                  <h2 className="text-xl font-bold">Admin Panel - {selectedAdmin?.admin_name}</h2>
                  {adminDetails && (
                    <p className="text-sm text-green-100 mt-1">
                      {selectedAdmin?.license_key} • {adminDetails.email} • ID: {adminDetails.id}
                    </p>
                  )}
                </div>
                
                {/* Panel Type Tabs - Center */}
                <div className="flex items-center justify-center flex-1">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPanelType('admin');
                        setActiveTab('create-services');
                        setServicesDropdownOpen(false);
                        setReportsDropdownOpen(false);
                      }}
                      className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${
                        panelType === 'admin'
                          ? 'bg-white text-green-600 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </button>
                    <button
                      onClick={() => {
                        setPanelType('user');
                        setActiveTab('dashboard');
                        setServicesDropdownOpen(false);
                        setReportsDropdownOpen(false);
                      }}
                      className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${
                        panelType === 'user'
                          ? 'bg-white text-green-600 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      User
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => setShowAdminModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body - Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-58 border-r border-gray-200 bg-gray-50">
                <nav className="p-4 space-y-1">
                  {panelType === 'admin' ? (
                    <>
                      {/* Admin Panel Options */}
                      {/* Services Dropdown */}
                      <div>
                        <SidebarButton 
                          active={activeTab === 'create-services' || activeTab === 'assign-services'} 
                          onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                          label="Services"
                          arrow
                          dropdownOpen={servicesDropdownOpen}
                        />
                        {servicesDropdownOpen && (
                          <div className="ml-8 mt-1 space-y-1">
                            <button
                              onClick={() => setActiveTab('create-services')}
                              className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
                                activeTab === 'create-services'
                                  ? 'bg-white text-green-600 font-medium'
                                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create Services
                            </button>
                            <button
                              onClick={() => setActiveTab('assign-services')}
                              className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
                                activeTab === 'assign-services'
                                  ? 'bg-white text-green-600 font-medium'
                                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Assign Services
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Reports Dropdown */}
                      <div>
                        <SidebarButton 
                          active={activeTab === 'reports' || activeTab === 'details-reports' || activeTab === 'short-reports'} 
                          onClick={() => setReportsDropdownOpen(!reportsDropdownOpen)}
                          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                          label="Reports"
                          arrow
                          dropdownOpen={reportsDropdownOpen}
                        />
                        {reportsDropdownOpen && (
                          <div className="ml-8 mt-1 space-y-1">
                          
                            <button
                              onClick={() => setActiveTab('details-reports')}
                              className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
                                activeTab === 'details-reports'
                                  ? 'bg-white text-green-600 font-medium'
                                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Details Reports
                            </button>
                            <button
                              onClick={() => setActiveTab('short-reports')}
                              className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
                                activeTab === 'short-reports'
                                  ? 'bg-white text-green-600 font-medium'
                                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Short Reports
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <SidebarButton 
                        active={activeTab === 'configuration'} 
                        onClick={() => setActiveTab('configuration')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                        label="Configuration"
                      />
                      <SidebarButton 
                        active={activeTab === 'counter'} 
                        onClick={() => setActiveTab('counter')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        label="Counter Display"
                      />
                    
                      <SidebarButton 
                        active={activeTab === 'user-sessions'} 
                        onClick={() => setActiveTab('user-sessions')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        label="User & Sessions"
                      />
                      <SidebarButton 
                        active={activeTab === 'display'} 
                        onClick={() => setActiveTab('display')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>}
                        label="Display Sessions"
                      />
                      <SidebarButton 
                        active={activeTab === 'dashboard-btns'} 
                        onClick={() => setActiveTab('dashboard-btns')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        label="User Dashboard Btns"
                      />
                      <SidebarButton 
                        active={activeTab === 'activity-logs'} 
                        onClick={() => setActiveTab('activity-logs')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        label="Activity Logs"
                      />
                      <SidebarButton 
                        active={activeTab === 'backup'} 
                        onClick={() => setActiveTab('backup')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                        label="Backup & Restore"
                      />
                    </>
                  ) : (
                    <>
                      {/* User Panel Options */}
                      <SidebarButton 
                        active={activeTab === 'dashboard'} 
                        onClick={() => setActiveTab('dashboard')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                        label="Dashboard"
                      />
                      <SidebarButton 
                        active={activeTab === 'completed-tasks'} 
                        onClick={() => setActiveTab('completed-tasks')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        label="Completed Tasks"
                      />
                    </>
                  )}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {loadingAdmin ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {panelType === 'admin' ? (
                      <>
                        {/* Admin Panel Content */}
                        {activeTab === 'create-services' && <CreateServicesPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'assign-services' && <AssignServicesPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'reports' && <ReportsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'details-reports' && <DetailsReportsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'short-reports' && <ShortReportsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'configuration' && <ConfigurationPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'counter' && <CounterDisplayPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'users' && <CreateAdminPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'user-sessions' && <UserSessionsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'display' && <DisplayScreensSessionsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'dashboard-btns' && <UserDashboardBtnsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'activity-logs' && <ActivityLogsPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'backup' && <BackupRestorePage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                      </>
                    ) : (
                      <>
                        {/* User Panel Content */}
                        {activeTab === 'dashboard' && <DashboardPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'completed-tasks' && <CompletedTasksPage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                        {activeTab === 'profile' && <ProfilePage adminId={selectedAdmin?.admin_id || adminDetails?.id} />}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label, arrow, dropdownOpen }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:bg-white hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {arrow && (
        <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
