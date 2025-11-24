'use client';
import { useState } from 'react';

export default function CompletedTasks() {
  const [startDate, setStartDate] = useState('2025-01-24');
  const [endDate, setEndDate] = useState('2025-11-24');

  const completedTasks = [
    { 
      id: 1, 
      ticketCreatedTime: '2025-10-15 14:48:05', 
      ticketNumber: 'E-306', 
      service: 'Emirates ID Renewal',
      statusUpdateTime: '2025-10-21 14:42:02',
      calledCount: 28,
      calledTime: '2025-10-21 14:42:02',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Unattendant',
      solvedBy: 19
    },
    { 
      id: 2, 
      ticketCreatedTime: '2025-10-15 14:47:55', 
      ticketNumber: 'P-204', 
      service: 'Payment Services',
      statusUpdateTime: '2025-10-15 22:17:42',
      calledCount: 4,
      calledTime: '2025-10-15 22:17:42',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Unattendant',
      solvedBy: 18
    },
    { 
      id: 3, 
      ticketCreatedTime: '2025-10-15 14:47:52', 
      ticketNumber: 'S-402', 
      service: 'Special Needs',
      statusUpdateTime: '2025-10-15 22:16:31',
      calledCount: 18,
      calledTime: '2025-10-15 22:16:28',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Solved',
      solvedBy: 18
    },
    { 
      id: 4, 
      ticketCreatedTime: '2025-10-15 14:47:49', 
      ticketNumber: 'S-401', 
      service: 'Special Needs',
      statusUpdateTime: '2025-10-15 15:11:56',
      calledCount: 1,
      calledTime: '2025-10-15 15:08:58',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Solved',
      solvedBy: 19
    },
    { 
      id: 5, 
      ticketCreatedTime: '2025-10-15 14:47:46', 
      ticketNumber: 'E-304', 
      service: 'Emirates ID New',
      statusUpdateTime: '2025-10-15 15:08:18',
      calledCount: 4,
      calledTime: '2025-10-15 15:07:55',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Not Solved',
      solvedBy: 19
    },
    { 
      id: 6, 
      ticketCreatedTime: '2025-10-15 14:47:43', 
      ticketNumber: 'L-503', 
      service: 'Labor Services',
      statusUpdateTime: '0000-00-00 00:00:00',
      calledCount: 0,
      calledTime: '0000-00-00 00:00:00',
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      status: 'Unattendant',
      solvedBy: 19
    },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Solved':
        return 'bg-green-500 text-white';
      case 'Not Solved':
        return 'bg-red-500 text-white';
      case 'Unattendant':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-700 mb-6">Completed Tickets</h1>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-lg font-medium transition-colors">
              Filter
            </button>
          </div>
        </div>

        {/* Completed Tasks Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Created Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    T.#
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Update Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Called Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Called Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solved By C.#
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.ticketCreatedTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.ticketNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.service}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {task.statusUpdateTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {task.calledCount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {task.calledTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.transferInfo}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {task.transferTime}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-4 py-2 rounded font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {task.solvedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
