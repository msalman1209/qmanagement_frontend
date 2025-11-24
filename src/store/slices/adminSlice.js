import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  admins: [],
  currentAdmin: null,
  loading: false,
  error: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdmins: (state, action) => {
      state.admins = action.payload
      state.loading = false
      state.error = null
    },
    
    setCurrentAdmin: (state, action) => {
      state.currentAdmin = action.payload
    },
    
    addAdmin: (state, action) => {
      state.admins.push(action.payload)
    },
    
    updateAdmin: (state, action) => {
      const index = state.admins.findIndex(a => a.id === action.payload.id)
      if (index !== -1) {
        state.admins[index] = { ...state.admins[index], ...action.payload }
      }
      
      if (state.currentAdmin?.id === action.payload.id) {
        state.currentAdmin = { ...state.currentAdmin, ...action.payload }
      }
    },
    
    removeAdmin: (state, action) => {
      state.admins = state.admins.filter(a => a.id !== action.payload)
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
    
    clearAdmins: (state) => {
      state.admins = []
      state.currentAdmin = null
    },
  },
})

export const {
  setAdmins,
  setCurrentAdmin,
  addAdmin,
  updateAdmin,
  removeAdmin,
  setLoading,
  setError,
  clearError,
  clearAdmins,
} = adminSlice.actions

export default adminSlice.reducer

// Selectors
export const selectAllAdmins = (state) => state.admin.admins
export const selectCurrentAdmin = (state) => state.admin.currentAdmin
export const selectAdminLoading = (state) => state.admin.loading
export const selectAdminError = (state) => state.admin.error
