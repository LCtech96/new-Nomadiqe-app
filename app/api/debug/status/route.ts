import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  // Disable debug endpoints in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production'
    }, { status: 403 })
  }
  
  try {
    const session = await getServerSession(authOptions)
    
    const result: any = {
      hasSession: !!session,
      timestamp: new Date().toISOString()
    }

    if (session?.user) {
      result.session = {
        email: session.user.email,
        id: session.user.id,
        role: session.user.role,
        onboardingStatus: session.user.onboardingStatus,
        onboardingStep: session.user.onboardingStep
      }

      // Try to get user from database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          include: {
            accounts: {
              select: {
                provider: true,
                providerAccountId: true
              }
            }
          },
          select: {
            id: true,
            email: true,
            role: true,
            onboardingStatus: true,
            onboardingStep: true,
            accounts: true
          }
        })

        result.database = {
          found: !!dbUser,
          user: dbUser ? {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            onboardingStatus: dbUser.onboardingStatus,
            onboardingStep: dbUser.onboardingStep,
            hasGoogleAccount: dbUser.accounts?.some((acc: { provider: string }) => acc.provider === 'google') || false,
            accountsCount: dbUser.accounts?.length || 0
          } : null
        }

        if (dbUser) {
          result.comparison = {
            onboardingStatusMatch: session.user.onboardingStatus === dbUser.onboardingStatus,
            roleMatch: session.user.role === dbUser.role,
            sessionOnboardingStatus: session.user.onboardingStatus,
            dbOnboardingStatus: dbUser.onboardingStatus
          }
        }
      } catch (dbError) {
        // Sanitize error message to prevent exposing DATABASE_URL
        let errorMessage = 'Unknown error'
        if (dbError instanceof Error) {
          errorMessage = dbError.message
          // Remove any potential DATABASE_URL or password exposure
          errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
          errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
          errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
        }
        result.database = {
          error: errorMessage
        }
      }
    } else {
      result.message = 'No active session. Please login first at /auth/signin'
    }

    return NextResponse.json(result, { status: 200 })
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
      error: 'Failed to get status',
      details: errorMessage
    }, { status: 500 })
  }
}

