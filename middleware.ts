import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Always allow manifest files (must not be intercepted or redirected)
    if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
      return NextResponse.next()
    }

    // Redirect completed users away from onboarding pages
    if (pathname.startsWith('/onboarding') && token?.onboardingStatus === 'COMPLETED') {
      const dashboardUrl = token.role === 'HOST' ? '/dashboard/host'
        : token.role === 'INFLUENCER' ? '/dashboard/influencer'
        : '/dashboard'
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Skip middleware for onboarding-related API paths
    if (pathname.startsWith('/api/onboarding')) {
      return NextResponse.next()
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
          return NextResponse.redirect(new URL('/onboarding', req.url))
        }
      }
    }

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check if user is trying to access host routes without being a host
    if (pathname.startsWith('/host') && !['HOST', 'ADMIN'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
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
