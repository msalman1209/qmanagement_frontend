"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CounterSelectionModal({ isOpen, onClose, adminId, token, onCounterSelect }) {
  const [counters, setCounters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCounter, setSelectedCounter] = useState(null)

  useEffect(() => {
    if (isOpen && adminId && token) {
      fetchCounters()
    }
  }, [isOpen, adminId, token])

  const fetchCounters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiUrl}/admin/counters/${adminId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch counters')
      }

      const data = await response.json()
      
      if (data.success) {
        setCounters(data.counters)
      } else {
        throw new Error(data.message || 'Failed to load counters')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching counters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCounterClick = (counter) => {
    if (!counter.isOccupied) {
      setSelectedCounter(counter.counter_no)
    }
  }

  const handleConfirm = () => {
    if (selectedCounter) {
      onCounterSelect(selectedCounter)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Select Your Counter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCounters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : counters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No counters available</p>
            </div>
          ) : (
            <>
              {/* Counter Select Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Counter
                </label>
                <select
                  value={selectedCounter || ''}
                  onChange={(e) => setSelectedCounter(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none text-base"
                >
                  <option value="">-- Select Counter --</option>
                  {counters.map((counter) => (
                    <option
                      key={counter.counter_no}
                      value={counter.counter_no}
                      disabled={counter.isOccupied}
                      style={{
                        backgroundColor: counter.isOccupied ? '#fee2e2' : 'white',
                        color: counter.isOccupied ? '#dc2626' : '#374151'
                      }}
                    >
                      Counter {counter.counter_no}
                      {counter.isOccupied ? ' (In Use)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && counters.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleConfirm}
              disabled={!selectedCounter}
              className={`
                w-full py-3 rounded-lg font-semibold transition-colors
                ${
                  selectedCounter
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Confirm Selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
