import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  statistics: {
    total_tickets: 0,
    solved: 0,
    pending: 0,
    transferred: 0,
    unattendant: 0,
    not_solved: 0,
  },
  sessions: [],
  reports: [],
  loading: false,
  error: null,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStatistics: (state, action) => {
      state.statistics = action.payload
      state.loading = false
      state.error = null
    },
    
    updateStatistics: (state, action) => {
      state.statistics = { ...state.statistics, ...action.payload }
    },
    
    setSessions: (state, action) => {
      state.sessions = action.payload
      state.loading = false
    },
    
    setReports: (state, action) => {
      state.reports = action.payload
      state.loading = false
    },
    
    incrementStat: (state, action) => {
      const { key } = action.payload
      if (state.statistics[key] !== undefined) {
        state.statistics[key] += 1
      }
    },
    
    decrementStat: (state, action) => {
      const { key } = action.payload
      if (state.statistics[key] !== undefined && state.statistics[key] > 0) {
        state.statistics[key] -= 1
      }
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    resetDashboard: (state) => {
      state.statistics = initialState.statistics
      state.sessions = []
      state.reports = []
    },
  },
})

export const {
  setStatistics,
  updateStatistics,
  setSessions,
  setReports,
  incrementStat,
  decrementStat,
  setLoading,
  setError,
  clearError,
  resetDashboard,
} = dashboardSlice.actions

export default dashboardSlice.reducer

// Selectors
export const selectStatistics = (state) => state.dashboard.statistics
export const selectSessions = (state) => state.dashboard.sessions
export const selectReports = (state) => state.dashboard.reports
export const selectDashboardLoading = (state) => state.dashboard.loading
export const selectDashboardError = (state) => state.dashboard.error
