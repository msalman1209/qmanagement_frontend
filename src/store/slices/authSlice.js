import { createSlice } from '@reduxjs/toolkit'

// Generate unique tab ID for this session
const getTabId = () => {
  if (typeof window === 'undefined') return null
  
  // Check sessionStorage for existing tab ID
  let tabId = sessionStorage.getItem('tabId')
  if (!tabId) {
    // Generate new unique tab ID
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('tabId', tabId)
  }
  return tabId
}

// Get session storage key with tab ID
const getStorageKey = (key) => {
  const tabId = getTabId()
  return tabId ? `${key}_${tabId}` : key
}

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
      
      // Store in sessionStorage - USE SIMPLE KEYS for compatibility
      if (typeof window !== 'undefined') {
        // Simple keys that sessionStorage.js can read
        sessionStorage.setItem('auth_token', token)
        sessionStorage.setItem('auth_user', JSON.stringify(user))
        sessionStorage.setItem('isAuthenticated', 'true')
        
        // Also keep tab-specific for Redux state
        sessionStorage.setItem(getStorageKey('token'), token)
        sessionStorage.setItem(getStorageKey('user'), JSON.stringify(user))
        
        // Set cookies for middleware - CRITICAL for page refresh
        setCookie('isAuthenticated', 'true', 7)
        setCookie('userRole', user.role, 7)
        setCookie(`token_${state.tabId}`, token, 7)
        
        console.log('🍪 Cookies set for role:', user.role)
        console.log('💾 SessionStorage saved with auth_token key')
      }
    },
    
    logout: (state) => {
      const currentTabId = state.tabId
      
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear sessionStorage - both simple and tab-specific keys
      if (typeof window !== 'undefined') {
        // Clear simple keys
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('isAuthenticated')
        
        // Clear tab-specific keys
        sessionStorage.removeItem(getStorageKey('token'))
        sessionStorage.removeItem(getStorageKey('user'))
        sessionStorage.removeItem(getStorageKey('isAuthenticated'))
        
        // Clear cookies
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
        if (currentTabId) {
          deleteCookie(`token_${currentTabId}`)
        }
        
        console.log('🧹 Session cleared - logout')
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
      
      // Update sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(getStorageKey('user'), JSON.stringify(state.user))
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
        
        // Store in sessionStorage - USE SIMPLE KEYS
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_token', token)
          sessionStorage.setItem('auth_user', JSON.stringify(user))
          sessionStorage.setItem('isAuthenticated', 'true')
          
          // Ensure cookies are set - CRITICAL for middleware on page refresh
          setCookie('isAuthenticated', 'true', 7)
          setCookie('userRole', user.role, 7)
          setCookie(`token_${state.tabId}`, token, 7)
          
          console.log('🍪 Cookies restored for role:', user.role)
          console.log('💾 Auth restored with auth_token key')
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
