import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import ticketReducer from './slices/ticketSlice'
import userReducer from './slices/userSlice'
import serviceReducer from './slices/serviceSlice'
import adminReducer from './slices/adminSlice'
import configReducer from './slices/configSlice'
import dashboardReducer from './slices/dashboardSlice'
import licenseReducer from './slices/licenseSlice'

// Get tab-specific storage key
const getTabId = () => {
  if (typeof window === 'undefined') return null
  // Use localStorage for tab ID to persist across refreshes
  let tabId = localStorage.getItem('tabId')
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('tabId', tabId)
  }
  return tabId
}

const getStorageKey = (key) => {
  const tabId = getTabId()
  return tabId ? `${key}_${tabId}` : key
}

// Load state from localStorage (1 week persistence)
const loadState = () => {
  try {
    if (typeof window === 'undefined') return undefined

    // Try to load from localStorage (primary) - 1 week persistence
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      const user = JSON.parse(userStr)
      return {
        auth: {
          user,
          token,
          isAuthenticated: true,
          loading: false,
          error: null,
          tabId: getTabId(),
        },
      }
    }
  } catch (err) {
    console.error('Error loading state from localStorage:', err)
  }
  return undefined
}

const preloadedState = loadState()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ticket: ticketReducer,
    user: userReducer,
    service: serviceReducer,
    admin: adminReducer,
    config: configReducer,
    dashboard: dashboardReducer,
    license: licenseReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['auth/setCredentials', 'auth/restoreAuth'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export default store
