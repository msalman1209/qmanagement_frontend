// Session storage utilities for authentication

// Get token from session storage
export const getToken = () => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('auth_token')
}

// Get user from session storage
export const getUser = () => {
  if (typeof window === 'undefined') return null
  const userStr = sessionStorage.getItem('auth_user')
  return userStr ? JSON.parse(userStr) : null
}

// Check if authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('auth_token') !== null
}

// Set session data
export const setSessionData = (token, user) => {
  if (typeof window === 'undefined') return
  
  sessionStorage.setItem('auth_token', token)
  sessionStorage.setItem('auth_user', JSON.stringify(user))
  console.log('✅ Session data saved:', { token: token.substring(0, 20) + '...', user: user.username })
}

// Clear session data
export const clearSessionData = () => {
  if (typeof window === 'undefined') return
  
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_user')
  console.log('🧹 Session data cleared')
}
