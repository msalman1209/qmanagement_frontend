'use client';
import { useState } from 'react';
import { FaFilter, FaCalendarAlt, FaSearch, FaChevronDown, FaFileWord } from 'react-icons/fa';
import { HiMenu } from 'react-icons/hi';

export default function SuperAdminPage() {
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const services = [
    {
      t: 'P-201',
      c: 'P',
      serviceName: 'Payment Services',
      name: '',
      email: '',
      representative: '',
      transferred: 'No',
      transferredTime: '0000-00-00 00:00:00',
      transferBy: '',
      lastUpdated: '2025-11-22 11:52:13',
      createdAt: '2025-11-22 11:52:13',
      caller: '0',
      callingTime: '0000-00-00 00:00:00',
      callingUserTime: '0000-00-00 00:00:00',
      status: 'Pending',
      statusTime: '0000-00-00 00:00:00',
      reason: '',
      serviceTime: '00:00:00'
    },
    {
      t: 'S-401',
      c: 'S',
      serviceName: 'Special Needs',
      name: '',
      email: '',
      representative: '',
      transferred: 'No',
      transferredTime: '0000-00-00 00:00:00',
      transferBy: '',
      lastUpdated: '2025-11-22 11:52:40',
      createdAt: '2025-11-22 11:52:40',
      caller: '0',
      callingTime: '0000-00-00 00:00:00',
      callingUserTime: '0000-00-00 00:00:00',
      status: 'Pending',
      statusTime: '0000-00-00 00:00:00',
      reason: '',
      serviceTime: '00:00:00'
    }
  ];

  return (
    <div className="p-8">
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
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-500 min-w-[150px]"
          >
            <option value="">Filter By (Optional)</option>
            <option value="service">Service Name</option>
            <option value="status">Status</option>
            <option value="caller">Caller</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Enter Value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded min-w-[200px]"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-500 min-w-[150px]"
        >
          <option value="">Select Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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

        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            placeholder="mm/dd/yyyy"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
          <FaSearch />
          Filter
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <button className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 flex items-center gap-2">
          Select Columns <FaChevronDown />
        </button>
        <button className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 flex items-center gap-2">
          <FaFileWord /> Download as Word
        </button>
      </div>

      {/* Service Details Table */}
      <div style={{width:'940px'}} className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Service Details</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{minWidth: '100%', width: 'max-content'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">T#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">C#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Service Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Representative</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Transferred</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Transferred Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Transfer By</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Last Updated</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Created At</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Caller</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Calling Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Calling User Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Status Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Service Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.t}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.c}</td>
                  <td className="px-3 py-3 text-sm text-green-600 whitespace-nowrap">{service.serviceName}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.name}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.email}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.representative}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.transferred}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.transferredTime}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.transferBy}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.lastUpdated}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.createdAt}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.caller}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.callingTime}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.callingUserTime}</td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <span className="text-green-600">{service.status}</span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.statusTime}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.reason}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{service.serviceTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer
      <div className="mt-8 text-center text-gray-500 text-sm">
        © 2025 , made with ❤️ by <span className="font-semibold text-gray-700">TechSolutionor</span>
      </div> */}
    </div>
  );
}
