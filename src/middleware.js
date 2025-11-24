import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Check authentication via cookie
  const hasAuth = request.cookies.get('isAuthenticated')?.value === 'true'
  const userRole = request.cookies.get('userRole')?.value
  
  // Public paths that don't require authentication
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => pathname === path)
  
  // Allow public paths
  if (isPublicPath) {
    // If authenticated user tries to access login, redirect to their dashboard
    if (pathname === '/login' && hasAuth && userRole) {
      const roleMapping = {
        'super_admin': 'superadmin',
        'admin': 'admin',
        'user': 'user'
      }
      const mappedRole = roleMapping[userRole] || 'user'
      return NextResponse.redirect(new URL(`/${mappedRole}`, request.url))
    }
    return NextResponse.next()
  }
  
  // Protected routes - require authentication
  if (!hasAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Allow access to role-based routes - ProtectedRoute component will handle role validation
  return NextResponse.next()
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
