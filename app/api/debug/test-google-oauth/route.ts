import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/debug/test-google-oauth
 * Tests if NextAuth can construct the Google OAuth URL
 */
export async function GET() {
  try {
    const googleProvider = authOptions.providers.find((p: any) => p.id === 'google')
    
    if (!googleProvider) {
      return NextResponse.json({
        error: 'Google provider not found',
        providers: authOptions.providers.map((p: any) => ({ id: p.id, name: p.name })),
      }, { status: 500 })
    }

    // Try to get the authorization URL that NextAuth would use
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/auth/callback/google`
    
    // Check if provider has the necessary methods
    const providerInfo = {
      id: googleProvider.id,
      name: googleProvider.name,
      type: (googleProvider as any).type,
      hasAuthorization: typeof (googleProvider as any).authorization === 'function',
      hasToken: typeof (googleProvider as any).token === 'function',
      hasUserInfo: typeof (googleProvider as any).userinfo === 'function',
    }

    // Try to construct authorization URL manually to see if credentials are valid
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    let manualAuthUrl = null
    if (clientId && callbackUrl) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      })
      manualAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    }

    return NextResponse.json({
      provider: providerInfo,
      configuration: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdPreview: clientId?.substring(0, 30) + '...',
        callbackUrl,
        baseUrl,
      },
      manualAuthUrl: manualAuthUrl ? manualAuthUrl.substring(0, 200) + '...' : null,
      status: 'OK',
      message: 'Google provider is configured. Check manualAuthUrl to see if credentials are valid.',
    })
  } catch (error) {
    console.error('[TEST-GOOGLE-OAUTH] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Google OAuth configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}





