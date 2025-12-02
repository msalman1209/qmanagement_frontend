'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getToken } from '@/utils/sessionStorage';

export default function UserDashboard() {
  const router = useRouter();
  const [currentTicket, setCurrentTicket] = useState('');
  const [manualTicketId, setManualTicketId] = useState('');
  const [totalPending, setTotalPending] = useState(0);
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTickets, setVisibleTickets] = useState(5);
  const [isCalling, setIsCalling] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchAssignedTickets = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/user/tickets/assigned?status=Pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const tickets = res.data.tickets || [];
        const services = res.data.assignedServices || [];
        
        console.log('Assigned Services from API:', services);
        
        setUnassignedTickets(tickets);
        setTotalPending(res.data.totalPending || tickets.length);
        setAssignedServices(services);
        
        // Set first ticket as current
        if (tickets.length > 0) {
          setCurrentTicket(tickets[0].ticketNumber);
        }
      }
    } catch (error) {
      console.error('[UserDashboard] Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTickets();
  }, []);

  const loadMoreTickets = () => {
    fetchAssignedTickets();
  };

  const handleCall = async () => {
    if (currentTicket && !isCalling) {
      const token = getToken();
      if (!token) return;
      
      setIsCalling(true); // Disable button
      
      try {
        // Prepare ticket data immediately (optimistic update)
        const ticketData = {
          ticket: currentTicket,
          counter: '', // Will be updated from response
          timestamp: new Date().getTime()
        };
        
        // Broadcast immediately for instant UI update
        const channel = new BroadcastChannel('ticket-calls');
        channel.postMessage(ticketData);
        
        // Call the ticket API (don't await, process in background)
        axios.post(
          `${apiUrl}/user/call-ticket`,
          { ticketNumber: currentTicket },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(response => {
          console.log('✅ Ticket called successfully:', response.data);
          
          // Update with actual counter number
          const updatedData = {
            ...ticketData,
            counter: response.data.counterNo || ''
          };
          
          // Save to localStorage for persistence
          localStorage.setItem('latest_ticket_call', JSON.stringify(updatedData));
          
          // Broadcast updated data with counter
          channel.postMessage(updatedData);
        }).catch(error => {
          console.error('[UserDashboard] Error calling ticket:', error);
        }).finally(() => {
          channel.close();
        });
        
        // Re-enable button immediately after 500ms
        setTimeout(() => setIsCalling(false), 500);
        
      } catch (error) {
        console.error('[UserDashboard] Error calling ticket:', error);
        setIsCalling(false);
      }
    }
  };

  const handleNext = () => {
    const currentIndex = unassignedTickets.findIndex(t => t.ticketNumber === currentTicket);
    if (currentIndex < unassignedTickets.length - 1) {
      setCurrentTicket(unassignedTickets[currentIndex + 1].ticketNumber);
    }
  };

  const handleAccept = () => {
    console.log('Accept button clicked');
  };

  const handleSelectManual = () => {
    if (manualTicketId.trim()) {
      setCurrentTicket(manualTicketId);
      setManualTicketId('');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Assigned Services Info */}
        {assignedServices && assignedServices.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Assigned Services:</strong> {assignedServices.map(s => s.name || s.service_name).join(', ')}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>No services assigned.</strong> Please contact your administrator to assign services.
            </p>
          </div>
        )}

        {/* Top Section */}
        <div className="flex ml-2 gap-3 mb-6">
          {/* Load More Tickets Card - Left */}
          <div className="w-45 rounded-lg">
            <button
              onClick={loadMoreTickets}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-base font-medium transition-colors mb-3"
            >
              Load More Tickets
            </button>
            <div className="bg-white rounded-lg shadow-md px-2 py-2 text-center">
              <p className="text-[15px] leading-[22.95px] text-gray-600 text-center">Total Pending Tickets</p>
              <p className="text-2xl font-bold mt-2 text-gray-800">{totalPending}</p>
            </div>
          </div>

          {/* Current Ticket ID Card - Center */}
          <div className="flex-1 bg-white rounded-lg shadow-md py-8 px-6 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <h1 className="text-[38px] font-semibold text-gray-700">
                Current Ticket ID:
              </h1>
              <p className="text-[38px] font-bold text-gray-900">{currentTicket}</p>
            </div>
          </div>

          {/* Show Called Tickets Button - Right */}
          <div className="flex text-[15px] leading-[22.95px] items-start justify-end width-[180px]">
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2.5 rounded-lg text-base font-medium transition-colors">
              Show Called Tickets
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={handleCall}
            disabled={isCalling}
            className={`px-10 py-3 rounded-lg text-lg font-medium transition-colors ${
              isCalling 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isCalling ? 'Calling...' : 'Call'}
          </button>
          <button
            onClick={handleNext}
            className="bg-red-500 hover:bg-red-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            Next
          </button>
          <button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            Accept
          </button>
        </div>

        {/* Manual Ticket Entry */}
        <div className="flex justify-center gap-3 mb-6">
          <input
            type="text"
            value={manualTicketId}
            onChange={(e) => setManualTicketId(e.target.value)}
            placeholder="Enter Manual Ticket ID"
            className="px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-72 bg-white text-base"
          />
          <button
            onClick={handleSelectManual}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg text-base font-medium transition-colors"
          >
            Select
          </button>
        </div>

        {/* Unassigned Tickets Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Unassigned Tickets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unassignedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No pending tickets found for your assigned services.
                    </td>
                  </tr>
                ) : (
                  unassignedTickets.slice(0, visibleTickets).map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.submissionTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.submissionDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {unassignedTickets.length > visibleTickets && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setVisibleTickets(visibleTickets + 5)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Show More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
