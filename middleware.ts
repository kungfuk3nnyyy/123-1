import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

/**
 * Helper function to determine if a route should be publicly accessible
 * Returns true for all marketplace, profile, and public pages
 */
function isPublicRoute(pathname: string): boolean {
  // Homepage and auth pages
  if (pathname === '/' || pathname.startsWith('/auth/')) {
    return true
  }
  
  // Marketplace and public discovery pages
  if (pathname === '/marketplace' || pathname.startsWith('/marketplace/')) {
    return true
  }
  
  // Public profile pages - organizer and talent profiles
  if (pathname.match(/^\/organizer\/[^\/]+$/)) {
    return true
  }
  
  if (pathname.match(/^\/talent\/[^\/]+$/)) {
    return true
  }
  
  // Package detail pages
  if (pathname.match(/^\/packages\/[^\/]+$/)) {
    return true
  }
  
  // Event detail pages  
  if (pathname.match(/^\/events\/[^\/]+$/)) {
    return true
  }
  
  // Other public pages that might exist
  if (pathname.startsWith('/about') || 
      pathname.startsWith('/contact') || 
      pathname.startsWith('/terms') || 
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/help')) {
    return true
  }
  
  return false
}

/**
 * Helper function to determine if a route requires authentication
 * Returns true for dashboard routes and protected API endpoints
 */
function requiresAuth(pathname: string): boolean {
  // Admin routes always require authentication
  if (pathname.startsWith('/admin')) {
    return true
  }
  
  // Dashboard routes (but not public profile pages)
  if (pathname.startsWith('/organizer/dashboard') || 
      pathname.startsWith('/talent/dashboard')) {
    return true
  }
  
  // Protected API routes
  if (pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/organizer') ||
      pathname.startsWith('/api/talent') ||
      pathname.startsWith('/api/bookings') ||
      pathname.startsWith('/api/messages') ||
      pathname.startsWith('/api/payments')) {
    return true
  }
  
  return false
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Early exit for public routes - no further checks needed
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // For protected routes, verify authentication and apply role-based access control
    if (requiresAuth(pathname)) {
      // Admin routes - require ADMIN role and approval
      if (pathname.startsWith('/admin')) {
        if (token?.role !== UserRole.ADMIN) {
          return NextResponse.redirect(new URL('/auth/login', req.url))
        }
        
        if (token?.adminApprovalStatus !== 'APPROVED') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      // Organizer dashboard routes - require ORGANIZER role
      if (pathname.startsWith('/organizer/dashboard')) {
        if (token?.role !== UserRole.ORGANIZER) {
          return NextResponse.redirect(new URL('/auth/login', req.url))
        }
      }

      // Talent dashboard routes - require TALENT role
      if (pathname.startsWith('/talent/dashboard')) {
        if (token?.role !== UserRole.TALENT) {
          return NextResponse.redirect(new URL('/auth/login', req.url))
        }
      }

      // Admin API routes - require ADMIN role and approval
      if (pathname.startsWith('/api/admin')) {
        if (token?.role !== UserRole.ADMIN) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        if (token?.adminApprovalStatus !== 'APPROVED') {
          return NextResponse.json({ 
            error: 'Admin account not approved' 
          }, { status: 403 })
        }
      }

      // Other protected API routes - require appropriate role
      if (pathname.startsWith('/api/organizer') && token?.role !== UserRole.ORGANIZER) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (pathname.startsWith('/api/talent') && token?.role !== UserRole.TALENT) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow all public routes without authentication
        if (isPublicRoute(pathname)) {
          return true
        }

        // For routes that require authentication, check if token exists
        if (requiresAuth(pathname)) {
          return !!token
        }

        // Default: allow access (for any routes not explicitly handled above)
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - api/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, videos, etc.)
     */
    '/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.mp4|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)'
  ]
}
