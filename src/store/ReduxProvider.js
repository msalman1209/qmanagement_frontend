'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { useEffect } from 'react'
import { restoreAuth } from './slices/authSlice'

// Helper to set cookie
function setCookie(name, value, days = 7) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Helper to delete cookie
function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

export function ReduxProvider({ children }) {
  useEffect(() => {
    // Restore auth from localStorage on mount
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          store.dispatch(restoreAuth({ user, token }))
          
          // Set cookies for middleware
          setCookie('isAuthenticated', 'true', 7)
          setCookie('userRole', user.role, 7)
          setCookie('token', token, 7)
        } catch (err) {
          console.error('Failed to restore auth:', err)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          deleteCookie('isAuthenticated')
          deleteCookie('userRole')
          deleteCookie('token')
        }
      } else {
        // Clear cookies if no auth
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
        deleteCookie('token')
      }
    }

    // Listen for storage changes (logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
        deleteCookie('token')
        window.location.href = '/login'
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return <Provider store={store}>{children}</Provider>
}
