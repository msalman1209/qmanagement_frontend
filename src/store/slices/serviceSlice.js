import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  services: [],
  currentService: null,
  assignedServices: [],
  loading: false,
  error: null,
}

const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    setServices: (state, action) => {
      state.services = action.payload
      state.loading = false
      state.error = null
    },
    
    setCurrentService: (state, action) => {
      state.currentService = action.payload
    },
    
    setAssignedServices: (state, action) => {
      state.assignedServices = action.payload
    },
    
    addService: (state, action) => {
      state.services.push(action.payload)
    },
    
    updateService: (state, action) => {
      const index = state.services.findIndex(s => s.id === action.payload.id)
      if (index !== -1) {
        state.services[index] = { ...state.services[index], ...action.payload }
      }
      
      if (state.currentService?.id === action.payload.id) {
        state.currentService = { ...state.currentService, ...action.payload }
      }
    },
    
    removeService: (state, action) => {
      state.services = state.services.filter(s => s.id !== action.payload)
      state.assignedServices = state.assignedServices.filter(s => s.id !== action.payload)
    },
    
    assignService: (state, action) => {
      if (!state.assignedServices.find(s => s.id === action.payload.id)) {
        state.assignedServices.push(action.payload)
      }
    },
    
    unassignService: (state, action) => {
      state.assignedServices = state.assignedServices.filter(s => s.id !== action.payload)
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
    
    clearServices: (state) => {
      state.services = []
      state.currentService = null
      state.assignedServices = []
    },
  },
})

export const {
  setServices,
  setCurrentService,
  setAssignedServices,
  addService,
  updateService,
  removeService,
  assignService,
  unassignService,
  setLoading,
  setError,
  clearError,
  clearServices,
} = serviceSlice.actions

export default serviceSlice.reducer

// Selectors
export const selectAllServices = (state) => state.service.services
export const selectCurrentService = (state) => state.service.currentService
export const selectAssignedServices = (state) => state.service.assignedServices
export const selectServiceLoading = (state) => state.service.loading
export const selectServiceError = (state) => state.service.error
