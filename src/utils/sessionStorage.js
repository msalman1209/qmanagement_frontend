// Session storage utilities for authentication
// Uses localStorage for 1 week persistence + cookies as backup

// Cookie utilities
const setCookie = (name, value, days = 7) => {
  if (typeof window === 'undefined') return
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`
}

const getCookie = (name) => {
  if (typeof window === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) return value
  }
  return null
}

const deleteCookie = (name) => {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Get token from localStorage (primary) or cookie (fallback)
export const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || getCookie('token')
}

// Get user from localStorage (primary) or cookie (fallback)
export const getUser = () => {
  if (typeof window === 'undefined') return null
  let userStr = localStorage.getItem('user')
  if (!userStr) {
    userStr = getCookie('user')
  }
  return userStr ? JSON.parse(decodeURIComponent(userStr)) : null
}

// Get complete session data (token + user)
export const getSessionData = () => {
  if (typeof window === 'undefined') return null
  const token = getToken()
  const user = getUser()
  
  if (!token || !user) return null
  
  return {
    token,
    user
  }
}

// Check if authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  return !!(localStorage.getItem('token') || getCookie('token'))
}

// Set session data - localStorage + cookies for 1 week persistence
export const setSessionData = (token, user) => {
  if (typeof window === 'undefined') return
  
  // Store in localStorage
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  
  // Also store in cookies as backup (1 week expiry)
  setCookie('token', token, 7)
  setCookie('user', encodeURIComponent(JSON.stringify(user)), 7)
  
  console.log('✅ Session data saved (localStorage + cookies):', { 
    token: token.substring(0, 20) + '...', 
    user: user.username 
  })
}

// Clear session data - only after backend confirms session is invalid
export const clearSessionData = () => {
  if (typeof window === 'undefined') return
  
  // Clear localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('role')
  
  // Clear cookies
  deleteCookie('token')
  deleteCookie('user')
  deleteCookie('isAuthenticated')
  deleteCookie('userRole')
  
  console.log('🧹 Session data cleared from localStorage and cookies')
}

// Verify session with backend before clearing
export const verifySessionWithBackend = async () => {
  if (typeof window === 'undefined') return { valid: false }
  
  const token = getToken()
  if (!token) return { valid: false }
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      return { valid: true, user: data.user }
    }
    
    return { valid: false }
  } catch (error) {
    console.error('❌ Session verification failed:', error)
    return { valid: false }
  }
}
