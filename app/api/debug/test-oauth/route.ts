import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/debug/test-oauth
 * Tests OAuth provider configuration
 */
export async function GET() {
  try {
    // Check environment variables
    const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID
    const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'NOT SET'

    // Check if Google provider is registered
    const googleProvider = authOptions.providers.find(p => p.id === 'google')
    
    // Calculate the actual redirect URI that NextAuth will use
    const baseUrl = nextAuthUrl !== 'NOT SET' ? nextAuthUrl : 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/callback/google`
    
    // Build issues list
    const issues: string[] = []
    if (!hasGoogleId) issues.push('GOOGLE_CLIENT_ID is missing in .env.local')
    if (!hasGoogleSecret) issues.push('GOOGLE_CLIENT_SECRET is missing in .env.local')
    if (!hasNextAuthSecret) issues.push('NEXTAUTH_SECRET is missing in .env.local')
    if (!googleProvider) issues.push('Google provider not registered in NextAuth (check if env vars are set)')
    if (nextAuthUrl === 'NOT SET') issues.push('NEXTAUTH_URL is not set (defaulting to http://localhost:3000)')
    
    return NextResponse.json({
      environment: {
        GOOGLE_CLIENT_ID: hasGoogleId ? `${process.env.GOOGLE_CLIENT_ID?.substring(0, 30)}...` : 'NOT SET',
        GOOGLE_CLIENT_SECRET: hasGoogleSecret ? '***' : 'NOT SET',
        NEXTAUTH_SECRET: hasNextAuthSecret ? '***' : 'NOT SET',
        NEXTAUTH_URL: nextAuthUrl,
      },
      provider: {
        registered: !!googleProvider,
        id: googleProvider?.id || 'NOT FOUND',
        name: googleProvider?.name || 'NOT FOUND',
      },
      redirectUri: {
        actual: redirectUri,
        shouldBeConfigured: 'Add this EXACT URL in Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs',
        googleCloudConsole: 'https://console.cloud.google.com/apis/credentials',
      },
      status: hasGoogleId && hasGoogleSecret && hasNextAuthSecret && !!googleProvider ? 'OK' : 'ERROR',
      issues: issues.length > 0 ? issues : ['No issues found'],
      instructions: {
        step1: '1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials',
        step2: `2. Click on your OAuth 2.0 Client ID (the one matching: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 30)}...)`,
        step3: `3. In "Authorized redirect URIs", add: ${redirectUri}`,
        step4: '4. Click SAVE',
        step5: '5. Restart your Next.js server (Ctrl+C, then pnpm dev)',
      },
    })
  } catch (error) {
    console.error('[TEST-OAUTH] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test OAuth configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

