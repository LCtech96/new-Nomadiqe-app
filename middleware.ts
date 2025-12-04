import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server"

// Helper function to apply security headers
function applySecurityHeaders(response: NextResponse) {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  )

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

// NextAuth v4: use withAuth middleware wrapper
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Always allow manifest files and authentication pages
    if (pathname === '/manifest.webmanifest' || 
        pathname === '/manifest.json' ||
        pathname.startsWith('/auth/')) {
      const response = NextResponse.next()
      applySecurityHeaders(response)
      return response
    }

    // Get user data from token (NextAuth v4 structure)
    const user = token as any
    const onboardingStatus = user?.onboardingStatus
    const role = user?.role

    // Redirect completed users away from onboarding pages
    if (pathname.startsWith('/onboarding') && onboardingStatus === 'COMPLETED') {
      const dashboardUrl = role === 'HOST' ? '/dashboard/host'
        : role === 'INFLUENCER' ? '/dashboard/influencer'
        : '/dashboard'
      const redirectResponse = NextResponse.redirect(new URL(dashboardUrl, req.url))
      applySecurityHeaders(redirectResponse)
      return redirectResponse
    }

    // Skip middleware for authentication and onboarding API paths
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/onboarding')) {
      const response = NextResponse.next()
      applySecurityHeaders(response)
      return response
    }

    // Check if authenticated user needs onboarding
    if (token && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
      // Redirect to onboarding if onboardingStatus is not COMPLETED
      if (!onboardingStatus || onboardingStatus !== 'COMPLETED') {
        // Only redirect if they're trying to access protected pages (not public pages)
        const publicPages = ['/', '/auth', '/search', '/experiences', '/property', '/terms', '/privacy']
        const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'))

        if (!isPublicPage) {
          const redirectResponse = NextResponse.redirect(new URL('/onboarding', req.url))
          applySecurityHeaders(redirectResponse)
          return redirectResponse
        }
      }
    }

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
      applySecurityHeaders(redirectResponse)
      return redirectResponse
    }

    // Check if user is trying to access host routes without being a host
    if (pathname.startsWith('/host') && !['HOST', 'ADMIN'].includes(role as string)) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
      applySecurityHeaders(redirectResponse)
      return redirectResponse
    }

    // Default: continue with security headers applied
    const response = NextResponse.next()
    applySecurityHeaders(response)
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow manifest files, authentication pages, and public pages
        if (pathname === '/manifest.webmanifest' || 
            pathname === '/manifest.json' ||
            pathname.startsWith('/auth/') ||
            pathname === '/' ||
            pathname.startsWith('/search') ||
            pathname.startsWith('/experiences') ||
            pathname.startsWith('/property') ||
            pathname === '/terms' ||
            pathname === '/privacy') {
          return true
        }

        // Allow API auth routes
        if (pathname.startsWith('/api/auth')) {
          return true
        }

        // Require authentication for other routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (authentication pages)
     * - public assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon|auth|manifest\\.webmanifest|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf)).*)',
  ],
}
