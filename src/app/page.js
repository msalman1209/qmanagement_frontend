'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function Home() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [showRecentTickets, setShowRecentTickets] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    number: ''
  });
  const [activeField, setActiveField] = useState('name');
  const [licenseData, setLicenseData] = useState(null);

  // Fetch services and license data for the logged-in user's admin
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !token) {
        console.log('No currentUser or token');
        return;
      }

      console.log('Current User:', currentUser);
      console.log('Admin ID:', currentUser.admin_id);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Fetch services
        const servicesResponse = await fetch(`${API_URL}/services/user/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.services || []);
        } else {
          console.error('Failed to fetch services');
        }

        // Fetch license data for admin
        if (currentUser.admin_id) {
          console.log('Fetching license for admin_id:', currentUser.admin_id);
          const licenseResponse = await fetch(`${API_URL}/license/admin-license/${currentUser.admin_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('License Response Status:', licenseResponse.status);
          
          if (licenseResponse.ok) {
            const licenseInfo = await licenseResponse.json();
            console.log('License Info:', licenseInfo);
            setLicenseData(licenseInfo.data);
          } else {
            const errorData = await licenseResponse.json();
            console.error('Failed to fetch license data:', errorData);
          }
        } else {
          console.error('No admin_id found in currentUser');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, token]);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If user is admin or super_admin, redirect to their dashboard
    if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
      router.push(`/${currentUser.role}/dashboard`);
      return;
    }

    // Receptionist (user role) can access this page
  }, [isAuthenticated, currentUser, router]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [reportTickets, setReportTickets] = useState([]);

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser || !token) return;

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Fetch today's tickets for recent tickets dropdown
        const recentResponse = await fetch(`${API_URL}/tickets?userId=${currentUser.id}&today=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          const formattedRecent = recentData.tickets.map(ticket => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_id,
            service: ticket.service_name,
            time: new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          }));
          setRecentTickets(formattedRecent);
        }

        // Fetch all tickets for reports
        const allResponse = await fetch(`${API_URL}/tickets?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (allResponse.ok) {
          const allData = await allResponse.json();
          const formattedAll = allData.tickets.map(ticket => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_id,
            dateTime: new Date(ticket.created_at).toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            service: ticket.service_name,
            user: currentUser.username,
            customerName: ticket.name || 'N/A',
            status: ticket.status ? ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1) : 'Pending'
          }));
          setReportTickets(formattedAll);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [currentUser, token]);

  const handleReprint = async (ticket) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Fetch ticket details from database
      const response = await fetch(`${API_URL}/tickets?search=${ticket.ticketNumber || ticket}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tickets && data.tickets.length > 0) {
          const ticketData = data.tickets[0];
          
          // Create service object for printing
          const service = {
            service_name: ticketData.service_name
          };
          
          // Customer details
          const customerData = {
            name: ticketData.name || '',
            email: ticketData.email || '',
            number: ticketData.number || ''
          };
          
          // Print the ticket
          printTicket(service, customerData, ticketData.ticket_id);
        }
      }
    } catch (error) {
      console.error('Error reprinting ticket:', error);
    }
  };

  const handleView = (ticket) => {
    console.log('Viewing ticket:', ticket);
    alert(`Viewing ticket: ${ticket.ticketNumber}\nService: ${ticket.service}\nUser: ${ticket.user}`);
  };

  const handleKeyPress = (key) => {
    if (key === 'Space') {
      setCustomerDetails(prev => ({
        ...prev,
        [activeField]: prev[activeField] + ' '
      }));
    } else if (key === 'Remove') {
      setCustomerDetails(prev => ({
        ...prev,
        [activeField]: prev[activeField].slice(0, -1)
      }));
    } else {
      setCustomerDetails(prev => ({
        ...prev,
        [activeField]: prev[activeField] + key
      }));
    }
  };

  const handleSkip = async () => {
    let ticketNumber = '';
    
    // Save ticket to database without customer details
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          user_id: currentUser.id,
          admin_id: currentUser.admin_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        ticketNumber = data.ticket_id;
        
        // Refresh tickets list
        const recentResponse = await fetch(`${API_URL}/tickets?userId=${currentUser.id}&today=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          const formattedRecent = recentData.tickets.map(ticket => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_id,
            service: ticket.service_name,
            time: new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          }));
          setRecentTickets(formattedRecent);
        }
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
    
    setShowDetailsModal(false);
    // Print ticket without customer details
    if (ticketNumber) {
      printTicket(selectedService, { name: '', email: '', number: '' }, ticketNumber);
    }
    setCustomerDetails({ name: '', email: '', number: '' });
  };

  const handleSubmit = async (service) => {
    console.log('Customer Details:', customerDetails);
    
    let ticketNumber = '';
    
    // Save ticket to database
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: service.id,
          name: customerDetails.name,
          email: customerDetails.email,
          number: customerDetails.number,
          user_id: currentUser.id,
          admin_id: currentUser.admin_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        ticketNumber = data.ticket_id;
        
        // Refresh tickets list
        const recentResponse = await fetch(`${API_URL}/tickets?userId=${currentUser.id}&today=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          const formattedRecent = recentData.tickets.map(ticket => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_id,
            service: ticket.service_name,
            time: new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          }));
          setRecentTickets(formattedRecent);
        }
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
    
    setShowDetailsModal(false);
    
    // Print ticket
    if (ticketNumber) {
      printTicket(service, customerDetails, ticketNumber);
    }
    
    // Reset form
    setCustomerDetails({ name: '', email: '', number: '' });
  };

  const printTicket = (service, customerData, ticketNumber) => {
    // Debug: Check license data
    console.log('License Data:', licenseData);
    console.log('Company Logo:', licenseData?.company_logo);
    console.log('Company Name:', licenseData?.company_name);
    
    const serviceName = service?.service_name || service || 'General Service';
    
    // Get current date and time
    const now = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    // Create print window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${ticketNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
          }
          .ticket {
            width: 80mm;
            background: white;
            margin: 0 auto;
          }
          .ticket-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 8px;
            text-align: center;
          }
          .logo-container {
            background: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
            color: #667eea;
            display: inline-block;
          }
          .ticket-details {
            padding: 12px 15px;
            text-align: center;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.4;
          }
          .service-type {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
          }
          .service-type strong {
            color: #667eea;
          }
          .customer-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
            padding: 6px;
            background: #f9f9f9;
            border-radius: 3px;
          }
          .customer-info p {
            margin: 3px 0;
          }
          .ticket-title {
            font-size: 11px;
            color: #666;
            margin-bottom: 3px;
          }
          .ticket-number {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin: 5px 0;
            letter-spacing: 1px;
          }
          .waiting-message {
            font-size: 11px;
            color: #666;
            margin: 8px 0;
            font-style: italic;
          }
          .date-time {
            font-size: 10px;
            color: #666;
            margin: 8px 0;
            padding: 6px;
            background: #f9f9f9;
            border-radius: 3px;
          }
          .date-time strong {
            color: #333;
          }
          .thank-you-text {
            font-size: 11px;
            color: #667eea;
            margin: 8px 0;
            font-weight: bold;
          }
          .company-sponser {
            font-size: 9px;
            color: #999;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #ddd;
          }
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .ticket {
              margin: 0;
              width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <div class="logo-container">
              ${licenseData?.company_logo ? `<img src="${process.env.NEXT_PUBLIC_API_URL_WS}${licenseData.company_logo}" alt="Logo" style="max-height: 60px; max-width: 180px; display: block; margin: 0 auto;" />` : 'LOGO'}
            </div>
          </div>
          <div class="ticket-details">
            <h2 class="company-name">${licenseData?.company_name || 'Emirates Professional Businessmen Services'}</h2>
            <p class="service-type">Service Type: <strong>${serviceName}</strong></p>
            ${customerData.name || customerData.email || customerData.number ? `
              <div class="customer-info">
                ${customerData.name ? `<p><strong>Name:</strong> ${customerData.name}</p>` : ''}
                ${customerData.email ? `<p><strong>Email:</strong> ${customerData.email}</p>` : ''}
                ${customerData.number ? `<p><strong>Number:</strong> ${customerData.number}</p>` : ''}
              </div>
            ` : ''}
            <p class="ticket-title">Ticket No</p>
            <h1 class="ticket-number">${ticketNumber}</h1>
            <p class="waiting-message">Please wait. We will serve you shortly.</p>
            <div class="date-time">
              <p>Date: <strong>${date}</strong> | Time: <strong>${time}</strong></p>
            </div>
            <p class="thank-you-text">Thank you for your service!</p>
            <p class="company-sponser">Designed by techsolutionor.com</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  useEffect(() => {
    if (showReportsModal || showDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReportsModal, showDetailsModal]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Title and Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Select Service
          </h1>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Ticket Info Display Button */}
            <button
              onClick={() => router.push('/ticket_info')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Ticket Display</span>
            </button>

            {/* Reports Button */}
            <button
              onClick={() => setShowReportsModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold">Reports</span>
            </button>

            {/* Recent Tickets Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRecentTickets(!showRecentTickets)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Recent Tickets</span>
                <svg className={`w-4 h-4 transition-transform ${showRecentTickets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showRecentTickets && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
                  </div>
                  <div className="py-2">
                    {recentTickets.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <p className="text-sm">No tickets created today</p>
                      </div>
                    ) : 
                      recentTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded">
                                {ticket.ticketNumber}
                              </span>
                              <span className="text-xs text-gray-500">{ticket.time}</span>
                            </div>
                            <p className="text-sm text-gray-600">{ticket.service}</p>
                          </div>
                          <button
                            onClick={() => handleReprint(ticket)}
                            className="ml-3 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Reprint
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Service Grid - Dynamic Cards from Database */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading services...</p>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Services Available</h3>
            <p className="text-gray-600">Please contact your administrator to add services.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const colors = ['purple', 'blue', 'green', 'red', 'yellow', 'indigo', 'pink', 'teal'];
              const color = service.color || colors[index % colors.length];
              const bgColor = service.color || `bg-${color}-600`;
              
              return (
                <div 
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setShowDetailsModal(true);
                  }}
                  className="rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{ backgroundColor: service.color || `rgb(${Math.random() * 100 + 100}, ${Math.random() * 100 + 50}, ${Math.random() * 100 + 100})` }}
                >
                  <div className="p-8 flex flex-col items-center justify-center text-white">
                    {service.logo_url ? (
                      <div className="w-24 h-24 mb-4 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                        <img src={`${process.env.NEXT_PUBLIC_API_URL_WS}${service.logo_url}`} alt={service.service_name} className="w-16 h-16 object-contain" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 mb-4 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <h5 className="text-xl font-semibold text-center mb-1">{service.service_name}</h5>
                    {service.service_name_arabic && (
                      <h6 className="text-sm text-center opacity-90">{service.service_name_arabic}</h6>
                    )}
                    {service.description && (
                      <p className="text-xs text-center opacity-75 mt-2">{service.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 py-6 border-t border-gray-200">
          <div className="py-4 px-8 text-gray-600">
            © {new Date().getFullYear()}, Developed By{' '}
            <a 
              href="https://techsolutionor.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-green-600 hover:text-blue-700"
            >
              TechSolutionor
            </a>
          </div>
        </footer>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Enter Your Details</h2>
                <p className="text-sm text-purple-100 mt-1">Optional - You can skip if you prefer</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Input Fields */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <input
                      type="text"
                      placeholder="Name"
                      value={customerDetails.name}
                      onFocus={() => setActiveField('name')}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg transition-all ${
                        activeField === 'name' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-300 bg-white'
                      } focus:outline-none focus:border-purple-500 focus:bg-purple-50`}
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <input
                      type="text"
                      placeholder="Email"
                      value={customerDetails.email}
                      onFocus={() => setActiveField('email')}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg transition-all ${
                        activeField === 'email' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-300 bg-white'
                      } focus:outline-none focus:border-purple-500 focus:bg-purple-50`}
                    />
                  </div>

                  {/* Number Field */}
                  <div>
                    <input
                      type="text"
                      placeholder="Number"
                      value={customerDetails.number}
                      onFocus={() => setActiveField('number')}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, number: e.target.value }))}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg transition-all ${
                        activeField === 'number' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-300 bg-white'
                      } focus:outline-none focus:border-purple-500 focus:bg-purple-50`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSkip}
                      className="flex-1 px-5 py-2.5 text-base font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleSubmit(selectedService)}
                      className="flex-1 px-5 py-2.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all shadow-lg"
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/* Right Side - On-Screen Keyboard */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-6 gap-1.5">
                    {/* Row 1 */}
                    {['Q', 'W', 'E', 'R', 'T', 'Y'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 2 */}
                    {['U', 'I', 'O', 'P', 'A', 'S'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 3 */}
                    {['D', 'F', 'G', 'H', 'J', 'K'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 4 */}
                    {['L', 'Z', 'X', 'C', 'V', 'B'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 5 */}
                    {['N', 'M', '1', '2', '3', '4'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 6 */}
                    {['5', '6', '7', '8', '9', '0'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                    
                    {/* Row 7 - Special Keys */}
                    <button
                      onClick={() => handleKeyPress('-')}
                      className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleKeyPress('_')}
                      className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                    >
                      _
                    </button>
                    <button
                      onClick={() => handleKeyPress('@')}
                      className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                    >
                      @
                    </button>
                    <button
                      onClick={() => handleKeyPress('.')}
                      className="px-3 py-2.5 text-base font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                    >
                      .
                    </button>
                    <button
                      onClick={() => handleKeyPress('Space')}
                      className="px-3 py-2.5 text-sm font-semibold text-blue-600 bg-white border-2 border-blue-500 rounded-md hover:bg-blue-50 transition-all shadow-sm"
                    >
                      Space
                    </button>
                    <button
                      onClick={() => handleKeyPress('Remove')}
                      className="px-3 py-2.5 text-sm font-semibold text-red-600 bg-white border-2 border-red-500 rounded-md hover:bg-red-50 transition-all shadow-sm"
                    >
                      ←
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowReportsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Tickets Report</h2>
                  <p className="text-sm text-blue-100 mt-0.5">View all ticket details and status</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportsModal(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ticket Number</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportTickets.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">No tickets found</p>
                              <p className="text-gray-400 text-sm mt-1">Create your first ticket to see it here</p>
                            </div>
                          </td>
                        </tr>
                      ) : 
                        reportTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">{ticket.dateTime}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded">
                              {ticket.ticketNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{ticket.service}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{ticket.customerName}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{ticket.user}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              ticket.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : ticket.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* View Button */}
                              <button
                                onClick={() => handleView(ticket)}
                                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>

                              {/* Reprint Button */}
                              <button
                                onClick={() => handleReprint(ticket)}
                                className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Reprint
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {/* <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">Total Tickets: <span className="font-semibold">{reportTickets.length}</span></p>
              <button
                onClick={() => setShowReportsModal(false)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

