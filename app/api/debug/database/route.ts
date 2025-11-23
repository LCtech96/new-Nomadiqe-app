import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/debug/database
 * Tests database connection and provides diagnostic information
 */
export async function GET() {
  // Disable debug endpoints in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production'
    }, { status: 403 })
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'N/A',
    },
    connection: {
      status: 'unknown',
      error: null as string | null,
      host: null as string | null,
      port: null as string | null,
    },
    tests: {
      basicQuery: { success: false, error: null as string | null },
      simpleCount: { success: false, error: null as string | null },
    },
    recommendations: [] as string[],
  }

  // Extract host and port from DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL)
      diagnostics.connection.host = url.hostname
      diagnostics.connection.port = url.port || '5432'
    } catch (e) {
      // URL parsing failed
    }
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    diagnostics.connection.status = 'error'
    diagnostics.connection.error = 'DATABASE_URL environment variable is not set'
    diagnostics.recommendations.push('Set DATABASE_URL in your .env.local file')
    diagnostics.recommendations.push('Get the connection string from Supabase Dashboard → Settings → Database → Connection string (URI format)')
    return NextResponse.json(diagnostics, { status: 200 })
  }

  // Test basic connection with a simple query
  try {
    await prisma.$queryRaw`SELECT 1 as test`
    diagnostics.tests.basicQuery.success = true
    diagnostics.connection.status = 'connected'
  } catch (error) {
    diagnostics.tests.basicQuery.success = false
    diagnostics.connection.status = 'error'
    
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      // Sanitize sensitive information
      errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
      errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
      errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
    }
    diagnostics.tests.basicQuery.error = errorMessage
    diagnostics.connection.error = errorMessage

    // Provide specific recommendations based on error
    if (errorMessage.includes("Can't reach database server")) {
      diagnostics.recommendations.push('The database server cannot be reached. Possible causes:')
      diagnostics.recommendations.push('1. The database might be paused (Supabase free tier pauses after inactivity)')
      diagnostics.recommendations.push('   → Check Supabase Dashboard → Your project → Overview → Database status')
      diagnostics.recommendations.push('   → If paused, click "Restore" to unpause it')
      diagnostics.recommendations.push('2. The DATABASE_URL might be incorrect or outdated')
      diagnostics.recommendations.push('   → Get a fresh connection string from Supabase Dashboard → Settings → Database')
      diagnostics.recommendations.push('3. Network/firewall issues')
      diagnostics.recommendations.push('   → Check your internet connection')
      diagnostics.recommendations.push('   → Verify you can access Supabase Dashboard')
    } else if (errorMessage.includes('authentication failed') || errorMessage.includes('password')) {
      diagnostics.recommendations.push('Authentication failed. Possible causes:')
      diagnostics.recommendations.push('1. The database password in DATABASE_URL is incorrect')
      diagnostics.recommendations.push('   → Reset the password in Supabase Dashboard → Settings → Database → Database password')
      diagnostics.recommendations.push('   → Update DATABASE_URL with the new password')
      diagnostics.recommendations.push('2. The database user credentials have changed')
    } else if (errorMessage.includes('does not exist')) {
      diagnostics.recommendations.push('Database or schema does not exist.')
      diagnostics.recommendations.push('→ Verify the database name in DATABASE_URL is correct')
      diagnostics.recommendations.push('→ Run database migrations if needed: pnpm prisma migrate dev')
    }

    // Don't return here, continue to test simple count
  }

  // Test a simple count query
  try {
    const userCount = await prisma.user.count()
    diagnostics.tests.simpleCount.success = true
    diagnostics.tests.simpleCount.count = userCount
  } catch (error) {
    diagnostics.tests.simpleCount.success = false
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      // Sanitize sensitive information
      errorMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
      errorMessage = errorMessage.replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@')
      errorMessage = errorMessage.replace(/password[=:][^\s]+/gi, 'password=***')
    }
    diagnostics.tests.simpleCount.error = errorMessage
  }

  if (diagnostics.connection.status === 'connected') {
    diagnostics.recommendations.push('✅ Database connection is working!')
  }

  return NextResponse.json(diagnostics, { status: 200 })
}

