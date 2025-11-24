'use client';
import { useState } from 'react';

export default function DisplayScreensSessionsPage() {
  const [ticketSessions, setTicketSessions] = useState([
    {
      sessionId: 89,
      username: 'admin',
      loginTime: '2025-11-22 12:32:24',
      device: 'web',
      active: 1
    }
  ]);

  const [serviceSessions, setServiceSessions] = useState([]);

  const handleDeleteTicket = (sessionId) => {
    const updatedSessions = ticketSessions.filter(session => session.sessionId !== sessionId);
    setTicketSessions(updatedSessions);
  };

  const handleDeleteService = (sessionId) => {
    const updatedSessions = serviceSessions.filter(session => session.sessionId !== sessionId);
    setServiceSessions(updatedSessions);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Active Sessions Management</h1>
      
      {/* Tickets Display Sessions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Tickets Display Sessions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Session ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Login Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ticketSessions.map((session, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{session.sessionId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.loginTime}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.device}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.active}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteTicket(session.sessionId)}
                      className="px-5 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Services Display Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Services Display Sessions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Session ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Login Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {serviceSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No active sessions found in display_sessions.
                  </td>
                </tr>
              ) : (
                serviceSessions.map((session, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{session.sessionId}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.loginTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.device}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.active}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteService(session.sessionId)}
                        className="px-5 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </td>
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
