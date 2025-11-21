import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
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
        dbTest.error = dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    } else {
      // Test basic connection without user lookup
      try {
        await prisma.$queryRaw`SELECT 1`
        dbTest.connected = true
      } catch (dbError) {
        dbTest.error = dbError instanceof Error ? dbError.message : 'Unknown database error'
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
    return NextResponse.json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

