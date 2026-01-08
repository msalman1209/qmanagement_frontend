import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Check authentication via cookie
  const hasAuth = request.cookies.get('isAuthenticated')?.value === 'true'
  const userRole = request.cookies.get('userRole')?.value
  
  // Debug logging
  if (pathname === '/') {
    console.log('🔒 Middleware check for "/"')
    console.log('🍪 hasAuth:', hasAuth)
    console.log('🎭 userRole:', userRole)
    console.log('📋 Cookies:', {
      isAuthenticated: request.cookies.get('isAuthenticated')?.value,
      userRole: request.cookies.get('userRole')?.value
    })
  }
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api', '/super-admin-secure-login', '/ticket-info-login', '/login']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Allow public paths
  if (isPublicPath) {
    // If authenticated user tries to access login, redirect based on their role
    if (pathname === '/login' && hasAuth && userRole) {
      // Receptionist goes to main page "/"
      if (userRole === 'receptionist') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      // User goes to user dashboard
      if (userRole === 'user') {
        return NextResponse.redirect(new URL('/user/dashboard', request.url))
      }
      // Admin and super_admin go to their dashboards
      const roleMapping = {
        'super_admin': '/superadmin/license/list-of-license',
        'admin': '/admin'
      }
      const redirectPath = roleMapping[userRole]
      if (redirectPath) {
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
    return NextResponse.next()
  }
  
  // Main page "/" - only for receptionist
  if (pathname === '/') {
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Only receptionists can access main page
    if (userRole === 'receptionist') {
      return NextResponse.next()
    }
    // Redirect others to their appropriate pages
    const roleMapping = {
      'user': '/user/dashboard',
      'super_admin': '/superadmin/license/list-of-license',
      'admin': '/admin'
    }
    const redirectPath = roleMapping[userRole] || '/login'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }
  
  // Protected routes - require authentication
  if (!hasAuth) {
    console.log(`🔒 Blocked unauthenticated access to: ${pathname}`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('reason', 'authentication_required')
    return NextResponse.redirect(loginUrl)
  }
  
  // Allow logout page for all authenticated users
  if (pathname.match(/^\/(superadmin|admin|user)\/logout$/)) {
    return NextResponse.next()
  }

  // Validate role-based access
  const roleRouteMapping = {
    'super_admin': '/superadmin',
    'admin': '/admin',
    'user': '/user',
    'receptionist': '/'
  }
  
  const allowedRoute = roleRouteMapping[userRole]
  
  // Check if user is trying to access a route they shouldn't
  if (allowedRoute && !pathname.startsWith(allowedRoute)) {
    // Check if trying to access another role's route
    const otherRoleRoutes = Object.values(roleRouteMapping).filter(route => route !== allowedRoute)
    const isAccessingOtherRole = otherRoleRoutes.some(route => pathname.startsWith(route))
    
    if (isAccessingOtherRole) {
      console.log(`🚫 Blocked ${userRole} from accessing: ${pathname}`)
      return NextResponse.redirect(new URL(allowedRoute, request.url))
    }
  }
  
  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
