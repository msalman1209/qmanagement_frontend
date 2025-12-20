'use client';
import { useState, useEffect } from 'react';
import { FaFilter, FaCalendarAlt, FaSearch, FaChevronDown, FaFileWord } from 'react-icons/fa';
import { HiMenu } from 'react-icons/hi';
import { useAuthContext } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getUser } from '@/utils/sessionStorage';


export default function DetailsReportsPage({ adminId: propAdminId }) {
  const { token, callAPI, user } = useAuthContext();
  const [effectiveAdminId, setEffectiveAdminId] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDate2, setStartDate2] = useState('');
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  
  // Available columns with their display names
  const allColumns = [
    { key: 'ticket_id', label: 'T#', selected: true },
    { key: 'counter_no', label: 'C#', selected: true },
    { key: 'service_name', label: 'Service Name', selected: true },
    { key: 'created_at', label: 'Created At', selected: true },
    { key: 'representative', label: 'Caller', selected: true },
    { key: 'calling_time', label: 'Calling Time', selected: true },
    { key: 'calling_user_time', label: 'Calling User Time', selected: true },
    { key: 'status', label: 'Status', selected: true },
    { key: 'status_time', label: 'Status Time', selected: true },
    { key: 'service_time', label: 'Service Time', selected: true },
    // { key: 'representative', label: 'Representative', selected: true },
    { key: 'transfered', label: 'Transferred', selected: true },
    { key: 'transfered_time', label: 'Transferred Time', selected: true },
    { key: 'transfer_by', label: 'Transfer By', selected: true },
    { key: 'reason', label: 'Reason', selected: true },
    { key: 'name', label: 'Name', selected: true },
    { key: 'email', label: 'Email', selected: true },
    { key: 'last_updated', label: 'Last Updated', selected: true }
  ];

  const [selectedColumns, setSelectedColumns] = useState(allColumns);

  // ✅ Initialize effectiveAdminId from prop or session
  useEffect(() => {
    if (propAdminId) {
      setEffectiveAdminId(propAdminId);
      console.log('✅ Using admin_id from prop:', propAdminId);
    } else {
      const sessionUser = getUser();
      if (sessionUser && sessionUser.admin_id) {
        setEffectiveAdminId(sessionUser.admin_id);
        console.log('✅ Using admin_id from logged-in user:', sessionUser.admin_id);
      } else if (sessionUser && sessionUser.role === 'admin') {
        setEffectiveAdminId(sessionUser.id);
        console.log('✅ Using admin_id from admin user:', sessionUser.id);
      } else {
        console.error('❌ No admin_id found in session');
      }
    }
  }, [propAdminId]);

  // Fetch tickets data
  useEffect(() => {
    if (effectiveAdminId) {
      fetchTickets();
      fetchCounters();
      fetchRepresentatives();
    }
  }, [effectiveAdminId]);

  // Fetch counters for current admin
  const fetchCounters = async () => {
    try {
      // ✅ Use effectiveAdminId to ensure users only see their admin's counters
      if (!effectiveAdminId) {
        console.log('⏭️ Skipping fetchCounters - effectiveAdminId not set yet');
        return;
      }

      const data = await callAPI(`/admin/counters/${effectiveAdminId}`, {
        method: 'GET',
        validateSession: false
      });
      
      // Create array of counters from 1 to totalCounters
      const counterList = [];
      for (let i = 1; i <= (data.totalCounters || 5); i++) {
        counterList.push({
          id: i,
          counter_no: i
        });
      }
      
      setCounters(counterList);
    } catch (err) {
      console.error('Error fetching counters:', err);
    }
  };

  // Fetch representatives (users under this admin)
  const fetchRepresentatives = async () => {
    try {
      // ✅ Use effectiveAdminId to ensure users only see their admin's representatives
      if (!effectiveAdminId) {
        console.log('⏭️ Skipping fetchRepresentatives - effectiveAdminId not set yet');
        return;
      }
      const endpoint = `/users/admin/${effectiveAdminId}`;
      
      const data = await callAPI(endpoint, {
        method: 'GET',
        validateSession: false
      });
      // Filter only users with role 'user'
      const userList = data.data || data.users || [];
      const userRoleOnly = userList.filter(u => u.role === 'user');
      setRepresentatives(userRoleOnly);
    } catch (err) {
      console.error('Error fetching representatives:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      // ✅ Always use effectiveAdminId to ensure users only see their admin's tickets
      if (!effectiveAdminId) {
        console.log('⏭️ Skipping fetchTickets - effectiveAdminId not set yet');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('adminId', effectiveAdminId);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';

      const data = await callAPI(endpoint, {
        method: 'GET',
        validateSession: false
      });
      
      console.log('Response:', data);
      setServices(data.tickets || []);
      console.log('Fetched tickets:', data.tickets);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      
      if (err.message.includes('Session expired')) {
        setError('Your session has expired. Please login again.');
      } else if (err.message.includes('License expired')) {
        setError('Your license has expired. Please contact support.');
      } else {
        setError('Failed to load tickets data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle column selection toggle
  const toggleColumn = (key) => {
    setSelectedColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    );
  };

  // Select/Deselect all columns
  const toggleAllColumns = (selectAll) => {
    setSelectedColumns(prev => 
      prev.map(col => ({ ...col, selected: selectAll }))
    );
  };

  // Format timestamp to YYYY-MM-DD HH:MM:SS
  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === '0000-00-00 00:00:00') return '-';
    
    try {
      // Check if it's ISO format (2025-12-16T06:34:54.000Z)
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        const date = new Date(timestamp);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      // MySQL format is already: "2025-12-03 11:03:50" - just return as-is
      return timestamp.trim();
    } catch (e) {
      return timestamp;
    }
  };

  // Get value for a specific column from ticket
  const getColumnValue = (ticket, key) => {
    switch(key) {
      case 'ticket_id':
        return ticket.ticket_id || '-';
      case 'counter_no':
        const counterNo = ticket.counter_no;
        // Check if it's a valid number (not null, not empty, not 0, and is actually a number)
        if (!counterNo || 
            counterNo === '' || 
            counterNo === '0' || 
            counterNo === 0 || 
            counterNo === 'null' || 
            counterNo === 'NULL' || 
            isNaN(Number(counterNo))) {  // If it's not a number (includes alphabets)
          return 'N/A';
        }
        return counterNo;
      case 'service_name':
        return ticket.service_name || '-';
      case 'created_at':
        return ticket.created_at ? formatTimestamp(ticket.created_at) : '-';
      case 'representative_id':
        return ticket.representative_id || '-';
      case 'calling_time':
        return ticket.call_count || ticket.calling_time || '0';
      case 'calling_user_time':
        return ticket.calling_user_time ? formatTimestamp(ticket.calling_user_time) : '-';
      case 'status':
        return ticket.status || 'Pending';
      case 'status_time':
        return ticket.status_time && ticket.status_time !== '0000-00-00 00:00:00' ? formatTimestamp(ticket.status_time) : '-';
      case 'reason':
        return ticket.reason || '-';
      case 'service_time':
        return ticket.service_time && ticket.service_time !== '0000-00-00 00:00:00' && ticket.service_time !== '00:00:00' ? ticket.service_time : '00:00:00';
      case 'name':
        return ticket.name || '-';
      case 'email':
        return ticket.email || '-';
      case 'representative':
        return ticket.representative || '-';
      case 'transfered':
        return ticket.transfered && ticket.transfered !== 'NULL' && ticket.transfered !== '' ? 'Yes' : 'No';
      case 'transfered_time':
        return ticket.transfered && ticket.transfered !== 'NULL' && ticket.transfered !== '' 
          ? (ticket.transfered_time && ticket.transfered_time !== '0000-00-00 00:00:00' ? formatTimestamp(ticket.transfered_time) : '-')
          : '-';
      case 'transfer_by':
        return ticket.transfer_by || '-';
      case 'last_updated':
        return ticket.last_updated ? formatTimestamp(ticket.last_updated) : '-';
      default:
        return '-';
    }
  };

  // Download as Excel (CSV format)
  const downloadAsExcel = () => {
    const visibleColumns = selectedColumns.filter(col => col.selected);
    
    // Create CSV header
    let csv = visibleColumns.map(col => col.label).join(',') + '\n';
    
    // Add data rows
    services.forEach(ticket => {
      const row = visibleColumns.map(col => {
        const value = getColumnValue(ticket, col.key);
        // Escape commas and quotes in values
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv += row.join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download as PDF
  const downloadAsPDF = () => {
    const visibleColumns = selectedColumns.filter(col => col.selected);
    
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    
    // Add title
    doc.setFontSize(18);
    doc.text('Service Details Report', 14, 20);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
    
    // Prepare table data
    const tableData = services.map(ticket => {
      return visibleColumns.map(col => {
        return String(getColumnValue(ticket, col.key));
      });
    });

    // Add table using autoTable function
    autoTable(doc, {
      head: [visibleColumns.map(col => col.label)],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] }, // Green color
      alternateRowStyles: { fillColor: [249, 249, 249] },
      margin: { top: 40, left: 10, right: 10 },
    });
    
    doc.save(`reports_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Download as Word
  const downloadAsWord = () => {
    const visibleColumns = selectedColumns.filter(col => col.selected);
    
    // Create HTML table
    let html = '<html><head><meta charset="utf-8"><title>Report</title></head><body>';
    html += '<h1>Service Details Report</h1>';
    html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
    
    // Add header
    html += '<thead><tr>';
    visibleColumns.forEach(col => {
      html += `<th style="background-color: #f3f4f6; padding: 8px;">${col.label}</th>`;
    });
    html += '</tr></thead>';
    
    // Add data rows
    html += '<tbody>';
    services.forEach(ticket => {
      html += '<tr>';
      visibleColumns.forEach(col => {
        const value = getColumnValue(ticket, col.key);
        html += `<td style="padding: 8px;">${value}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';
    
    // Create and download file
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.doc`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle filter
  const handleFilter = async () => {
    try {
      setLoading(true);
      
      // ✅ Ensure effectiveAdminId is available before filtering
      if (!effectiveAdminId) {
        console.error('❌ Cannot filter - no admin_id available');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      
      // Always add effectiveAdminId for admin-specific filtering
      params.append('adminId', effectiveAdminId);
      
      if (filterBy && filterValue) {
        if (filterBy === 'counter') {
          params.append('counter_no', filterValue);
        } else if (filterBy === 'representative') {
          params.append('representative_id', filterValue);
        }
      }
      if (status) params.append('status', status);
      if (startDate) params.append('from_date', startDate);
      if (startDate2) params.append('to_date', startDate2);

      const queryString = params.toString();
      const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
      
      const data = await callAPI(endpoint, {
        method: 'GET',
        validateSession: false
      });
      
      setServices(data.tickets || []);
      setError(null);
    } catch (err) {
      console.error('Error filtering tickets:', err);
      setError('Failed to filter tickets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchTickets}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full" style={{maxWidth: 'calc(100vw - 272px)'}}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-700">Admin Panel</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <HiMenu className="text-gray-400 text-xl" />
          <select
            value={filterBy}
            onChange={(e) => {
              setFilterBy(e.target.value);
              setFilterValue('');
            }}
            className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-500 min-w-[150px]"
          >
            <option value="">Filter By (Optional)</option>
            <option value="counter">Counter</option>
            <option value="representative">Representative</option>
          </select>
        </div>

        {filterBy === 'counter' ? (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded bg-white min-w-[200px]"
          >
            <option value="">Select Counter</option>
            {counters.map((counter) => (
              <option key={counter.id} value={counter.counter_no || counter.counter_number}>
                Counter {counter.counter_no || counter.counter_number}
              </option>
            ))}
          </select>
        ) : filterBy === 'representative' ? (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded bg-white min-w-[200px]"
          >
            <option value="">Select Representative</option>
            {representatives.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.username || rep.name || `User ${rep.id}`}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Enter Value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded min-w-[200px]"
          />
        )}

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-500 min-w-[150px]"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Solved">Solved</option>
          <option value="Not Solved">Not Solved</option>
          <option value="Unattended">Unattended</option>
        </select>

        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            placeholder="mm/dd/yyyy"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            placeholder="mm/dd/yyyy"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          />
        </div> */}
      </div>

      {/* Second Row Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            placeholder="mm/dd/yyyy"
            value={startDate2}
            onChange={(e) => setStartDate2(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <button 
          onClick={handleFilter}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <FaSearch />
          Filter
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-6 flex-wrap relative">
        <div className="relative">
          <button 
            onClick={() => setShowColumnModal(!showColumnModal)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
          >
            Select Columns <FaChevronDown />
          </button>
          
          {/* Column Selection Modal */}
          {showColumnModal && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-64 max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                  <h3 className="font-semibold text-gray-700">Select Columns</h3>
                  <button 
                    onClick={() => setShowColumnModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>                
                <div className="space-y-2">
                  {selectedColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-0 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={column.selected}
                        onChange={() => toggleColumn(column.key)}
                        className="w-4 h-4 text-green-600 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={downloadAsWord}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <FaFileWord /> Download as Word
        </button>
        <button 
          onClick={downloadAsPDF}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
        >
          Download as PDF
        </button>
        <button 
          onClick={downloadAsExcel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
        >
          Download as Excel
        </button>
      </div>

      {/* Service Details Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden w-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Service Details</h2>
        </div>
        
        <div className="overflow-auto max-w-full max-h-[400px]">
          <table className="w-full border-collapse table-auto">
            <thead className="bg-gray-50">
              <tr>
                {selectedColumns.filter(col => col.selected).map((column) => (
                  <th 
                    key={column.key}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={selectedColumns.filter(col => col.selected).length} className="px-3 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                services.map((ticket, index) => (
                  <tr key={ticket.id || index} className="hover:bg-gray-50">
                    {selectedColumns.filter(col => col.selected).map((column) => (
                      <td 
                        key={column.key}
                        className={`px-3 py-3 whitespace-nowrap ${
                          column.key === 'service_name' ? 'text-green-600 text-sm' : 
                          column.key === 'created_at' || column.key === 'calling_user_time' || column.key === 'status_time' || column.key === 'transfered_time' || column.key === 'last_updated' ? 'text-gray-900 text-xs' : 
                          'text-gray-900 text-sm'
                        }`}
                      >
                        {column.key === 'status' ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.status?.toLowerCase() === 'pending' || ticket.status?.toLowerCase() === 'unattended' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status?.toLowerCase() === 'solved' || ticket.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                            ticket.status?.toLowerCase() === 'not solved' || ticket.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status || 'Pending'}
                          </span>
                        ) : (
                          getColumnValue(ticket, column.key)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
