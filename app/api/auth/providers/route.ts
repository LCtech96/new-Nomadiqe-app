import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/auth/providers
 * Returns which OAuth providers are configured
 */
export async function GET() {
  try {
    const providers: Record<string, boolean> = {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
      apple: !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
    }

    return NextResponse.json(providers)
  } catch (error) {
    console.error('[PROVIDERS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    )
  }
}

