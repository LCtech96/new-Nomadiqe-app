import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server"

// Helper function to apply security headers
function applySecurityHeaders(response: NextResponse) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live", // unsafe-eval needed for Next.js dev mode
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  if (!isDevelopment) {
    const cspWithoutUnsafeEval = cspDirectives.map(directive => 
      directive.replace(" 'unsafe-eval'", "")
    )
    response.headers.set('Content-Security-Policy', cspWithoutUnsafeEval.join('; '))
  } else {
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Always allow manifest files (must not be intercepted or redirected)
    if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
      const response = NextResponse.next()
      applySecurityHeaders(response)
      return response
    }

    // Redirect completed users away from onboarding pages
    if (pathname.startsWith('/onboarding') && token?.onboardingStatus === 'COMPLETED') {
      const dashboardUrl = token.role === 'HOST' ? '/dashboard/host'
        : token.role === 'INFLUENCER' ? '/dashboard/influencer'
        : '/dashboard'
      const redirectResponse = NextResponse.redirect(new URL(dashboardUrl, req.url))
      applySecurityHeaders(redirectResponse)
      return redirectResponse
    }

    // Skip middleware for onboarding-related API paths
    if (pathname.startsWith('/api/onboarding')) {
      const response = NextResponse.next()
      applySecurityHeaders(response)
      return response
    }

    // Check if authenticated user needs onboarding
    if (token && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
      // Redirect to onboarding if onboardingStatus is not COMPLETED (regardless of role)
      // Users may have any role (GUEST, HOST, INFLUENCER) during onboarding
      // If onboardingStatus is undefined/null, treat as not completed
      const onboardingStatus = token.onboardingStatus
      if (!onboardingStatus || onboardingStatus !== 'COMPLETED') {
        // Only redirect if they're trying to access protected pages (not public pages)
        const publicPages = ['/', '/auth', '/search', '/experiences', '/property', '/terms', '/privacy']
        const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'))

        if (!isPublicPage) {
          // Redirect to /onboarding (not /profile-setup) to let the page handle smart routing to current step
          const redirectResponse = NextResponse.redirect(new URL('/onboarding', req.url))
          applySecurityHeaders(redirectResponse)
          return redirectResponse
        }
      }
    }

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
      applySecurityHeaders(redirectResponse)
      return redirectResponse
    }

    // Check if user is trying to access host routes without being a host
    if (pathname.startsWith('/host') && !['HOST', 'ADMIN'].includes(token?.role as string)) {
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
      authorized: ({ 
        token, 
        req 
      }: { 
        token: any
        req: NextRequest 
      }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/onboarding') ||
          pathname.startsWith('/api/onboarding') ||
          pathname.startsWith('/search') ||
          pathname.startsWith('/experiences') ||
          pathname.startsWith('/property/') ||
          pathname.startsWith('/terms') ||
          pathname.startsWith('/privacy') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon')
        ) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
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
     * - public assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon|manifest\\.webmanifest|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf)).*)',
  ],
}
