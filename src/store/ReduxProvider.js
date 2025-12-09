'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { useEffect } from 'react'
import { restoreAuth } from './slices/authSlice'
import { getToken, getUser, isAuthenticated } from '@/utils/sessionStorage'

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
    // Restore auth from sessionStorage on mount
    if (typeof window !== 'undefined') {
      const token = getToken()
      const user = getUser()
      const isAuth = isAuthenticated()
      
      console.log('🔄 ReduxProvider - Restoring auth...')
      console.log('🎫 Token exists:', !!token)
      console.log('👤 User exists:', !!user)
      console.log('✓ Is authenticated:', isAuth)
      console.log('🎭 User role:', user?.role)
      
      if (token && user && isAuth) {
        try {
          store.dispatch(restoreAuth({ user, token }))
          
          // Set cookies for middleware - IMPORTANT for page refresh
          setCookie('auth_token', token)
          setCookie('isAuthenticated', 'true', 7)
          setCookie('userRole', user.role, 7)
          
          console.log('✅ Auth restored successfully')
          console.log('🍪 Cookies set - role:', user.role)
        } catch (err) {
          console.error('❌ Failed to restore auth:', err)
          sessionStorage.clear()
          deleteCookie('auth_token')
          deleteCookie('isAuthenticated')
          deleteCookie('userRole')
        }
      } else {
        console.log('⚠️ No auth data found, clearing cookies')
        // Clear cookies if no auth in this tab
        deleteCookie('auth_token')
        deleteCookie('isAuthenticated')
        deleteCookie('userRole')
      }
    }
  }, [])

  return <Provider store={store}>{children}</Provider>
}
