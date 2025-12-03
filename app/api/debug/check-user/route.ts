import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * POST /api/debug/check-user
 * Check if user exists and verify password
 * Only available in development
 */
export async function POST(request: NextRequest) {
  // Disable debug endpoints in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production'
    }, { status: 403 })
  }

  try {
    const { email, password } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    console.log('[DEBUG_CHECK_USER] Checking user:', emailLower)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        onboardingStatus: true,
        onboardingStep: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: emailLower
      }, { status: 200 })
    }

    const result: any = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingStatus: user.onboardingStatus,
        onboardingStep: user.onboardingStep,
        createdAt: user.createdAt,
        hasPassword: !!user.password,
        passwordHashLength: user.password?.length || 0,
        passwordHashPrefix: user.password?.substring(0, 15) || null,
        isBcryptHash: user.password?.startsWith('$2') || false,
      }
    }

    // If password provided, test it
    if (password) {
      if (!user.password) {
        result.passwordTest = {
          provided: true,
          hasPassword: false,
          valid: false,
          error: 'User has no password (OAuth-only account)'
        }
      } else {
        try {
          const isValid = await bcrypt.compare(password, user.password)
          result.passwordTest = {
            provided: true,
            hasPassword: true,
            valid: isValid,
            error: isValid ? null : 'Password does not match'
          }
          
          if (!isValid) {
            // Additional debugging info
            result.passwordDebug = {
              providedPassword: password,
              providedPasswordLength: password.length,
              storedHashLength: user.password.length,
              storedHashPrefix: user.password.substring(0, 15),
              storedHashSuffix: user.password.substring(user.password.length - 10),
            }
          }
        } catch (error) {
          result.passwordTest = {
            provided: true,
            hasPassword: true,
            valid: false,
            error: error instanceof Error ? error.message : 'Error comparing password'
          }
        }
      }
    } else {
      result.passwordTest = {
        provided: false,
        message: 'No password provided for testing'
      }
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('[DEBUG_CHECK_USER] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}




