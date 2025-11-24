'use client';
import { useState } from 'react';
import { FaDownload } from 'react-icons/fa';

export default function ShortReportsPage() {
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-11-22');

  const reportData = [
    {
      user: 'user18',
      totalSolved: 2,
      notSolved: 0,
      unattendedTickets: 0,
      transferred: 0,
      total: 2,
      dateRange: '2025-01-01 to 2025-11-22'
    },
    {
      user: 'user19',
      totalSolved: 2,
      notSolved: 1,
      unattendedTickets: 0,
      transferred: 1,
      total: 4,
      dateRange: '2025-01-01 to 2025-11-22'
    }
  ];

  const handleFilter = () => {
    console.log('Filter applied:', { startDate, endDate });
  };

  const handleDownloadWord = () => {
    console.log('Download Word');
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Short Reports</h1>

      {/* Date Filter Section */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        <button
          onClick={handleFilter}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Download Buttons */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleDownloadWord}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition-colors"
        >
          <FaDownload />
          Download Word
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition-colors"
        >
          <FaDownload />
          Download PDF
        </button>
      </div>

      {/* Summary Details Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Summary Details</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Solved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Not Solved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unattended Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Transferred</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white bg-green-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date Range</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-500 text-white rounded font-medium">
                      {report.user}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.totalSolved}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.notSolved}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.unattendedTickets}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.transferred}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-lg inline-block min-w-[60px] text-center">
                      {report.total}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.dateRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
