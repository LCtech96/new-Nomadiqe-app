import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
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
            hasGoogleAccount: dbUser.accounts?.some(acc => acc.provider === 'google') || false,
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
        result.database = {
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        }
      }
    } else {
      result.message = 'No active session. Please login first at /auth/signin'
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

