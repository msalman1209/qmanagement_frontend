import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  configuration: {},
  counterDisplay: {},
  loading: false,
  error: null,
}

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfiguration: (state, action) => {
      state.configuration = action.payload
      state.loading = false
      state.error = null
    },
    
    updateConfiguration: (state, action) => {
      state.configuration = { ...state.configuration, ...action.payload }
    },
    
    setCounterDisplay: (state, action) => {
      state.counterDisplay = action.payload
      state.loading = false
    },
    
    updateCounterDisplay: (state, action) => {
      state.counterDisplay = { ...state.counterDisplay, ...action.payload }
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
  },
})

export const {
  setConfiguration,
  updateConfiguration,
  setCounterDisplay,
  updateCounterDisplay,
  setLoading,
  setError,
  clearError,
} = configSlice.actions

export default configSlice.reducer

// Selectors
export const selectConfiguration = (state) => state.config.configuration
export const selectCounterDisplay = (state) => state.config.counterDisplay
export const selectConfigLoading = (state) => state.config.loading
export const selectConfigError = (state) => state.config.error
