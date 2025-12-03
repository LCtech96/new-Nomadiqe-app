// NextAuth v4: Pages Router handler (natively supported)
// This file uses Pages Router which NextAuth v4 supports natively
// The rest of the app can continue using App Router
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Log configuration on server startup
if (typeof window === 'undefined') {
  console.log('[NextAuth] Pages Router handler initialized')
  console.log('[NextAuth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET')
  console.log('[NextAuth] Callback URL will be:', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`)
  console.log('[NextAuth] Expected redirect URI in Google Cloud Console:', 'http://localhost:3000/api/auth/callback/google')
}

// Export NextAuth handler directly - Pages Router handles everything automatically
const handler = NextAuth(authOptions)

// Add minimal logging wrapper to debug OAuth issues
export default async function(req: any, res: any) {
  // Log Google sign-in requests
  if (req.url?.includes('/signin/google')) {
    console.log('[NextAuth] 🔍 Google sign-in request received')
    console.log('[NextAuth] URL:', req.url)
    console.log('[NextAuth] Query:', req.query)
  }
  
  // Log errors in response
  const originalRedirect = res.redirect
  res.redirect = function(url: string) {
    if (url.includes('/auth/signin?error=') || url.includes('/auth/error')) {
      console.error('[NextAuth] ❌ Redirecting to error page:', url)
    } else if (url.includes('accounts.google.com')) {
      console.log('[NextAuth] ✅ Redirecting to Google OAuth')
    } else {
      console.log('[NextAuth] 🔄 Redirecting to:', url)
    }
    return originalRedirect.call(this, url)
  }
  
  return handler(req, res)
}

