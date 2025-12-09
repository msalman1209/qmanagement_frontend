import { createSlice } from '@reduxjs/toolkit'

// Generate unique tab ID for this session
const getTabId = () => {
  if (typeof window === 'undefined') return null
  
  // Use localStorage for tab ID to persist across refreshes
  let tabId = localStorage.getItem('tabId')
  if (!tabId) {
    // Generate new unique tab ID
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('tabId', tabId)
  }
  return tabId
}

// Get storage key with tab ID
const getStorageKey = (key) => {
  const tabId = getTabId()
  return tabId ? `${key}_${tabId}` : key
}

// Helper functions for cookies
const setCookie = (name, value, days = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
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
  tabId: null,
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
      state.tabId = getTabId()
      
      console.log('🔐 setCredentials called')
      console.log('👤 User role:', user.role)
      console.log('🎫 Token set:', !!token)
      
      // Store in localStorage for 1 week persistence
      if (typeof window !== 'undefined') {
        // Simple keys that sessionStorage.js can read
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isAuthenticated', 'true')
        
        // Set cookies for middleware - CRITICAL for page refresh (1 week)
        setCookie('isAuthenticated', 'true', 7)
        setCookie('userRole', user.role, 7)
        setCookie('token', token, 7)
        
        console.log('🍪 Cookies set for role:', user.role)
        console.log('💾 localStorage saved with token key (1 week)')
      }
    },
    
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      state.tabId = null
      
      // Clear localStorage - all auth keys
      if (typeof window !== 'undefined') {
        // Clear simple keys
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('role')
        localStorage.removeItem('tabId')
        
        // Clear cookies
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
        deleteCookie('token')
        deleteCookie('user')
        deleteCookie('admin_id')
        deleteCookie('userId')
        deleteCookie('username')
        
        console.log('🧹 Session cleared - logout (localStorage + cookies)')
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
        state.tabId = getTabId()
        
        console.log('🔄 restoreAuth called')
        console.log('👤 Restoring user role:', user.role)
        console.log('🎫 Token restored:', !!token)
        
        // Store in localStorage for 1 week persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
          localStorage.setItem('isAuthenticated', 'true')
          
          // Ensure cookies are set - CRITICAL for middleware on page refresh
          setCookie('isAuthenticated', 'true', 7)
          setCookie('userRole', user.role, 7)
          setCookie('auth_token', token, 7)
          setCookie(`token_${state.tabId}`, token, 7)
          
          console.log('🍪 Cookies restored for role:', user.role)
          console.log('💾 Auth restored with auth_token key (localStorage)')
        }
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
