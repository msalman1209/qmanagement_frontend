'use client';
import { useState } from 'react';

export default function UserSessionsPage() {
  const [sessions, setSessions] = useState([
    {
      counterNumber: 2,
      username: 'user18',
      loginTime: '11:57:16',
      date: '2025-11-22'
    },
    {
      counterNumber: 2,
      username: 'user19',
      loginTime: '12:32:08',
      date: '2025-11-22'
    }
  ]);

  const handleLogout = (username) => {
    console.log('Logout user:', username);
    const updatedSessions = sessions.filter(session => session.username !== username);
    setSessions(updatedSessions);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Active User Sessions</h1>
      
      {/* Logged In Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Logged In Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Counter Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Login Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{session.counterNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.loginTime}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleLogout(session.username)}
                      className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
