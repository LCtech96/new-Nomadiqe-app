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
    
    // Test database connection
    let dbTest = { connected: false, user: null, error: null as string | null }
    if (session?.user?.id) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, email: true, role: true, onboardingStatus: true, onboardingStep: true }
        })
        dbTest.connected = true
        dbTest.user = user
      } catch (dbError) {
        // Sanitize error message to prevent exposing DATABASE_URL
        let errorMessage = 'Unknown database error'
        if (dbError instanceof Error) {
          errorMessage = dbError.message
          // Remove any potential DATABASE_URL or password exposure
          errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
          errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
          errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
        }
        dbTest.error = errorMessage
      }
    } else {
      // Test basic connection without user lookup
      try {
        await prisma.$queryRaw`SELECT 1`
        dbTest.connected = true
      } catch (dbError) {
        // Sanitize error message to prevent exposing DATABASE_URL
        let errorMessage = 'Unknown database error'
        if (dbError instanceof Error) {
          errorMessage = dbError.message
          // Remove any potential DATABASE_URL or password exposure
          errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
          errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
          errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
        }
        dbTest.error = errorMessage
      }
    }
    
    return NextResponse.json({
      hasSession: !!session,
      session: session,
      user: session?.user,
      database: dbTest,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      timestamp: new Date().toISOString()
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
      error: 'Failed to get session',
      details: errorMessage
    }, { status: 500 })
  }
}

