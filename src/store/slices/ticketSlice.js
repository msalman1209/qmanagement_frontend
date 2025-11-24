import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tickets: [],
  currentTicket: null,
  pendingTickets: [],
  loading: false,
  error: null,
  filters: {
    status: '',
    from_date: '',
    to_date: '',
    counter_no: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
}

const ticketSlice = createSlice({
  name: 'ticket',
  initialState,
  reducers: {
    setTickets: (state, action) => {
      state.tickets = action.payload
      state.loading = false
      state.error = null
    },
    
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload
    },
    
    setPendingTickets: (state, action) => {
      state.pendingTickets = action.payload
      state.loading = false
    },
    
    addTicket: (state, action) => {
      state.tickets.unshift(action.payload)
      state.pendingTickets.unshift(action.payload)
    },
    
    updateTicket: (state, action) => {
      const index = state.tickets.findIndex(t => t.ticket_id === action.payload.ticket_id)
      if (index !== -1) {
        state.tickets[index] = { ...state.tickets[index], ...action.payload }
      }
      
      // Update pending tickets
      const pendingIndex = state.pendingTickets.findIndex(t => t.ticket_id === action.payload.ticket_id)
      if (pendingIndex !== -1) {
        if (action.payload.status !== 'Pending') {
          state.pendingTickets.splice(pendingIndex, 1)
        } else {
          state.pendingTickets[pendingIndex] = { ...state.pendingTickets[pendingIndex], ...action.payload }
        }
      }
      
      // Update current ticket
      if (state.currentTicket?.ticket_id === action.payload.ticket_id) {
        state.currentTicket = { ...state.currentTicket, ...action.payload }
      }
    },
    
    removeTicket: (state, action) => {
      state.tickets = state.tickets.filter(t => t.ticket_id !== action.payload)
      state.pendingTickets = state.pendingTickets.filter(t => t.ticket_id !== action.payload)
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
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
    
    clearTickets: (state) => {
      state.tickets = []
      state.currentTicket = null
      state.pendingTickets = []
    },
  },
})

export const {
  setTickets,
  setCurrentTicket,
  setPendingTickets,
  addTicket,
  updateTicket,
  removeTicket,
  setFilters,
  clearFilters,
  setPagination,
  setLoading,
  setError,
  clearError,
  clearTickets,
} = ticketSlice.actions

export default ticketSlice.reducer

// Selectors
export const selectAllTickets = (state) => state.ticket.tickets
export const selectCurrentTicket = (state) => state.ticket.currentTicket
export const selectPendingTickets = (state) => state.ticket.pendingTickets
export const selectTicketLoading = (state) => state.ticket.loading
export const selectTicketError = (state) => state.ticket.error
export const selectTicketFilters = (state) => state.ticket.filters
export const selectTicketPagination = (state) => state.ticket.pagination
