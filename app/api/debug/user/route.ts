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
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'No session found',
        message: 'Please log in first',
        instructions: 'Go to http://localhost:3000/auth/signin and login with Google, then refresh this page'
      }, { status: 200 }) // Changed to 200 so we can see the message
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
        onboardingProgress: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingStatus: true,
        onboardingStep: true,
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true
          }
        },
        onboardingProgress: {
          select: {
            currentStep: true,
            completedSteps: true,
            startedAt: true,
            completedAt: true
          }
        }
      }
    })

    return NextResponse.json({
      session: {
        email: session.user.email,
        id: session.user.id,
        role: session.user.role,
        onboardingStatus: session.user.onboardingStatus,
        onboardingStep: session.user.onboardingStep
      },
      database: {
        user: user,
        hasAccount: user?.accounts?.length > 0,
        accounts: user?.accounts || [],
        onboardingProgress: user?.onboardingProgress
      },
      comparison: {
        sessionOnboardingStatus: session.user.onboardingStatus,
        dbOnboardingStatus: user?.onboardingStatus,
        match: session.user.onboardingStatus === user?.onboardingStatus
      }
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
      error: 'Failed to get user data',
      details: errorMessage
      // Never expose stack traces in production
    }, { status: 500 })
  }
}

