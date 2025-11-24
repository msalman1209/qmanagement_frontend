'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { useEffect } from 'react'
import { restoreAuth } from './slices/authSlice'

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
        } catch (err) {
          console.error('Failed to restore auth:', err)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }, [])

  return <Provider store={store}>{children}</Provider>
}
