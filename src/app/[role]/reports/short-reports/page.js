'use client';
import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function ShortReportsPage({ adminId }) {
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check user role on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Current user role:', user.role);
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          setError(`Access denied. This page requires Admin or Super Admin role. Your role: ${user.role}`);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Fetch reports data
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // Add adminId to query params if provided from modal
      const queryParams = new URLSearchParams({
        startDate,
        endDate
      });
      if (adminId) {
        queryParams.append('adminId', adminId);
      }
      
      const response = await fetch(
        `${apiUrl}/tickets/reports?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Reports API Response:', data);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(data.message || 'Access denied. Admin or Super Admin role required.');
        }
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Failed to fetch reports');
      }

      if (data.success) {
        console.log('Report Data:', data.data);
        console.log('Number of reports:', data.data?.length);
        console.log('Sample report:', data.data?.[0]);
        setReportData(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when adminId changes
  useEffect(() => {
    fetchReports();
  }, [adminId]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('reportData state updated:', reportData);
    console.log('reportData length:', reportData.length);
    console.log('loading:', loading);
    console.log('error:', error);
    console.log('Should show table:', !loading && reportData.length > 0);
  }, [reportData, loading, error]);

  const handleFilter = () => {
    fetchReports();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Short Reports', 14, 20);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
    
    // Prepare table data
    const tableData = reportData.map(report => [
      report.user,
      report.totalSolved.toString(),
      report.notSolved.toString(),
      report.unattendedTickets.toString(),
      report.transferred.toString(),
      report.total.toString(),
      report.dateRange
    ]);

    // Add table using autoTable function
    autoTable(doc, {
      head: [['User', 'Total Solved', 'Not Solved', 'Unattended Tickets', 'Transferred', 'Total', 'Date Range']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }, // Green color
    });
    
    doc.save(`report_${startDate}_to_${endDate}.pdf`);
  };

  const handleDownloadWord = async () => {
    // Create table rows
    const tableRows = [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'User', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Total Solved', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Not Solved', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Unattended Tickets', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Transferred', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Total', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Date Range', alignment: AlignmentType.CENTER })],
            shading: { fill: '16A34A' },
          }),
        ],
      }),
      // Data rows
      ...reportData.map(report => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(report.user)] }),
          new TableCell({ children: [new Paragraph(report.totalSolved.toString())] }),
          new TableCell({ children: [new Paragraph(report.notSolved.toString())] }),
          new TableCell({ children: [new Paragraph(report.unattendedTickets.toString())] }),
          new TableCell({ children: [new Paragraph(report.transferred.toString())] }),
          new TableCell({ children: [new Paragraph(report.total.toString())] }),
          new TableCell({ children: [new Paragraph(report.dateRange)] }),
        ],
      })),
    ];

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'Short Reports',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Date Range: ${startDate} to ${endDate}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }), // Spacer
          table,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `report_${startDate}_to_${endDate}.docx`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Short Reports</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Filter'}
        </button>
      </div>

      {/* Download Buttons */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleDownloadWord}
          disabled={loading || reportData.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <FaDownload />
          Download Word
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={loading || reportData.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <FaDownload />
          Download PDF
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      )}

      {/* Summary Details Table */}
      {!loading && reportData.length > 0 && (
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
      )}

      {/* No Data State */}
      {!loading && reportData.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No reports found for the selected date range.</p>
        </div>
      )}
    </div>
  );
}
