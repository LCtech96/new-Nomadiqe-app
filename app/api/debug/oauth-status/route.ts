import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth'

/**
 * GET /api/debug/oauth-status
 * Returns detailed OAuth provider configuration status
 */
export async function GET() {
  try {
    const status = {
      google: {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        clientIdValue: process.env.GOOGLE_CLIENT_ID ? 
          `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 
          'NOT SET',
        isValid: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientIdFormat: process.env.GOOGLE_CLIENT_ID?.endsWith('.apps.googleusercontent.com') || false,
      },
      facebook: {
        clientId: !!process.env.FACEBOOK_CLIENT_ID,
        clientSecret: !!process.env.FACEBOOK_CLIENT_SECRET,
        isValid: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
      },
      apple: {
        clientId: !!process.env.APPLE_ID,
        clientSecret: !!process.env.APPLE_SECRET,
        isValid: !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
      },
      nextAuth: {
        secret: !!process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL || 'NOT SET',
      }
    }

    // Check which providers are actually registered in NextAuth
    const registeredProviders = authConfig.providers
      ?.filter((p: any) => p.id !== 'credentials')
      .map((p: any) => p.id) || []

    return NextResponse.json({
      ...status,
      registeredProviders,
      recommendations: {
        google: !status.google.isValid ? 
          '⚠️ Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local' :
          !status.google.clientIdFormat ?
          '⚠️ GOOGLE_CLIENT_ID format seems invalid (should end with .apps.googleusercontent.com)' :
          '✅ Google OAuth is properly configured',
        nextAuth: !status.nextAuth.secret ?
          '⚠️ NEXTAUTH_SECRET is required' :
          !status.nextAuth.url || status.nextAuth.url === 'NOT SET' ?
          '⚠️ NEXTAUTH_URL should be set (e.g., http://localhost:3000 for local dev)' :
          '✅ NextAuth is properly configured',
      }
    })
  } catch (error) {
    console.error('[OAUTH-STATUS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get OAuth status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

