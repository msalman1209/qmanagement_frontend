import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies or check if exists in request
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Check localStorage token via cookie (set by client)
  const hasAuth = request.cookies.get('isAuthenticated')?.value === 'true'
  
  // Public paths that don't require authentication
  const publicPaths = ['/login']
  
  // Check if current path is public
  const isPublicPath = publicPaths.some(path => pathname === path)
  
  // If it's a public path, allow access
  if (isPublicPath) {
    // If user is authenticated and trying to access login, redirect to dashboard
    if (pathname === '/login' && hasAuth) {
      const userRole = request.cookies.get('userRole')?.value
      
      if (userRole === 'super_admin' || userRole === 'admin') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      } else {
        return NextResponse.redirect(new URL('/user', request.url))
      }
    }
    return NextResponse.next()
  }
  
  // All other paths are protected
  if (!hasAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
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
