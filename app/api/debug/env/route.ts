import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in development or with a secret token
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_SECRET) {
    return NextResponse.json(
      { error: 'Not available in production without DEBUG_SECRET' },
      { status: 403 }
    )
  }

  // Check for secret token if in production
  if (process.env.DEBUG_SECRET) {
    // You can add token validation here if needed
  }

  const envCheck = {
    // Critical variables
    NEXTAUTH_SECRET: {
      set: !!process.env.NEXTAUTH_SECRET,
      length: process.env.NEXTAUTH_SECRET?.length || 0,
      preview: process.env.NEXTAUTH_SECRET?.substring(0, 10) + '...' || 'NOT SET'
    },
    NEXTAUTH_URL: {
      set: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL || 'NOT SET'
    },
    DATABASE_URL: {
      set: !!process.env.DATABASE_URL,
      hasPassword: process.env.DATABASE_URL?.includes('Nomadiqe2025') || false,
      host: process.env.DATABASE_URL?.match(/@([^:]+)/)?.[1] || 'NOT SET'
    },
    // Optional but important
    RESEND_API_KEY: {
      set: !!process.env.RESEND_API_KEY,
      preview: process.env.RESEND_API_KEY?.substring(0, 10) + '...' || 'NOT SET'
    },
    EMAIL_FROM: {
      set: !!process.env.EMAIL_FROM,
      value: process.env.EMAIL_FROM || 'NOT SET'
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      preview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...' || 'NOT SET'
    }
  }

  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    env: envCheck,
    issues: [
      !envCheck.NEXTAUTH_SECRET.set && 'NEXTAUTH_SECRET is missing',
      !envCheck.NEXTAUTH_URL.set && 'NEXTAUTH_URL is missing',
      !envCheck.DATABASE_URL.set && 'DATABASE_URL is missing',
    ].filter(Boolean)
  })
}




