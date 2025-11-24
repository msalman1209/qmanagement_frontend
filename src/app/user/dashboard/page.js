'use client';
import { useState } from 'react';

export default function UserDashboard() {
  const [currentTicket, setCurrentTicket] = useState('G-106');
  const [manualTicketId, setManualTicketId] = useState('');
  const [totalPending, setTotalPending] = useState(17);

  const unassignedTickets = [
    { id: 22, ticketNumber: 'G-106', service: 'General Services', submissionTime: '16:13:17', submissionDate: '2025-10-15' },
    { id: 23, ticketNumber: 'G-107', service: 'General Services', submissionTime: '16:13:42', submissionDate: '2025-10-15' },
    { id: 24, ticketNumber: 'G-108', service: 'General Services', submissionTime: '16:14:14', submissionDate: '2025-10-15' },
    { id: 25, ticketNumber: 'L-504', service: 'Labor Services', submissionTime: '16:25:05', submissionDate: '2025-10-15' },
    { id: 26, ticketNumber: 'L-505', service: 'Labor Services', submissionTime: '17:02:01', submissionDate: '2025-10-15' },
  ];

  const [visibleTickets, setVisibleTickets] = useState(5);

  const loadMoreTickets = () => {
    setTotalPending(totalPending + 10);
  };

  const handleCall = () => {
    console.log('Call button clicked');
  };

  const handleNext = () => {
    if (unassignedTickets.length > 0) {
      setCurrentTicket(unassignedTickets[0].ticketNumber);
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
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
            className="bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            Call
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
                {unassignedTickets.slice(0, visibleTickets).map((ticket) => (
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
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setVisibleTickets(visibleTickets + 5)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Show More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
