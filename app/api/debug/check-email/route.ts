import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  // Disable debug endpoints in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production'
    }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Get user from database (including password field to check if it exists)
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: 'User not found in database',
        email: emailLower
      }, { status: 200 })
    }

    // Check if user has password (password field is hashed, so null means no password)
    const hasPassword = user.password !== null && user.password !== undefined

    // Get OAuth accounts
    const oauthAccounts = user.accounts?.filter((acc: { type: string }) => acc.type === 'oauth') || []

    return NextResponse.json({
      exists: true,
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
      hasPassword: hasPassword,
      canLoginWithPassword: hasPassword,
      oauthAccounts: oauthAccounts.map((acc: { provider: string; providerAccountId: string }) => ({
        provider: acc.provider,
        accountId: acc.providerAccountId
      })),
      hasOAuthOnly: !hasPassword && oauthAccounts.length > 0,
      createdAt: user.createdAt,
      onboardingStatus: user.onboardingStatus,
      onboardingStep: user.onboardingStep,
      message: hasPassword 
        ? 'User exists and can login with email/password'
        : oauthAccounts.length > 0
        ? `User exists but can only login with OAuth providers: ${oauthAccounts.map((acc: { provider: string }) => acc.provider).join(', ')}. Use "Continue with ${oauthAccounts[0].provider.charAt(0).toUpperCase() + oauthAccounts[0].provider.slice(1)}" button instead.`
        : 'User exists but has no password or OAuth accounts - account may be incomplete'
    }, { status: 200 })

  } catch (error) {
    // Sanitize error message to prevent exposing sensitive information
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      // Remove any potential DATABASE_URL or password exposure
      errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
      errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
      errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
    }
    
    return NextResponse.json({
      error: 'Failed to check user',
      details: errorMessage
    }, { status: 500 })
  }
}

