import { createSlice } from '@reduxjs/toolkit'

// Helper functions for cookies
const setCookie = (name, value, days = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }
}

const deleteCookie = (name) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  }
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.error = null
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set cookies for middleware
        setCookie('isAuthenticated', 'true', 7)
        setCookie('userRole', user.role, 7)
        setCookie('token', token, 7)
      }
    },
    
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Clear cookies
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
        deleteCookie('token')
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
    
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    
    restoreAuth: (state, action) => {
      const { user, token } = action.payload
      if (user && token) {
        state.user = user
        state.token = token
        state.isAuthenticated = true
        
        // Ensure cookies are set
        setCookie('isAuthenticated', 'true', 7)
        setCookie('userRole', user.role, 7)
        setCookie('token', token, 7)
      }
    },
  },
})

export const {
  setCredentials,
  logout,
  setLoading,
  setError,
  clearError,
  updateUser,
  restoreAuth,
} = authSlice.actions

export default authSlice.reducer

// Selectors
export const selectCurrentUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
