import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail, sendAddPasswordEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * POST /api/auth/password/forgot
 * Request password reset for an email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email richiesta' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        password: true,
      }
    })

    // For security, don't reveal if email exists or not
    // But internally check if user has password (OAuth-only accounts can't reset password)
    if (!user) {
      // User doesn't exist - return success anyway (security best practice)
      console.log('[PASSWORD_RESET] Email not found (silent):', emailLower)
      return NextResponse.json({
        success: true,
        message: 'Se questa email è registrata, riceverai un link per reimpostare la password.'
      })
    }

    // Check if user has password (might be OAuth-only account)
    if (!user.password) {
      console.log('[PASSWORD_RESET] User exists but has no password (OAuth-only):', emailLower)
      
      // Check which OAuth providers are linked
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        select: { provider: true }
      })
      
      const oauthProviders = accounts.map(acc => acc.provider)
      console.log('[PASSWORD_RESET] OAuth providers linked:', oauthProviders)
      
      // For OAuth-only accounts, send "add password" email instead
      try {
        // Generate secure random token for adding password
        const addPasswordToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours
        
        // Delete any existing add-password tokens for this email
        await prisma.verificationToken.deleteMany({
          where: {
            identifier: `add-password:${emailLower}`,
          }
        })
        
        // Save token to database
        await prisma.verificationToken.create({
          data: {
            identifier: `add-password:${emailLower}`,
            token: addPasswordToken,
            expires: expiresAt,
          }
        })
        
        console.log('[PASSWORD_RESET] Token generated for adding password to OAuth-only account:', emailLower)
        
        // Send add password email instead of reset password email
        await sendAddPasswordEmail(emailLower, addPasswordToken)
        console.log('✅ [PASSWORD_RESET] Add password email sent successfully to OAuth-only account:', emailLower)
        
        return NextResponse.json({
          success: true,
          message: 'Se questa email è registrata, riceverai un link per aggiungere una password al tuo account.',
          isOAuthOnly: true // Flag to indicate this is an OAuth-only account
        })
      } catch (emailError: any) {
        console.error('❌ [PASSWORD_RESET] Failed to send add password email to OAuth-only account:', emailError)
        // Still return success for security (don't reveal account type or technical issues)
        return NextResponse.json({
          success: true,
          message: 'Se questa email è registrata, riceverai un link per reimpostare la password.',
        })
      }
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${emailLower}`,
      }
    })

    // Save token to database
    // Using verification_tokens table with identifier format: "password-reset:email"
    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${emailLower}`,
        token: resetToken,
        expires: expiresAt,
      }
    })

    console.log('[PASSWORD_RESET] Token generated for:', emailLower)
    console.log('[PASSWORD_RESET] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
    console.log('[PASSWORD_RESET] FROM_EMAIL:', process.env.EMAIL_FROM || 'onboarding@resend.dev')

    // Send password reset email
    try {
      console.log('[PASSWORD_RESET] Attempting to send email to:', emailLower)
      await sendPasswordResetEmail(emailLower, resetToken)
      console.log('✅ [PASSWORD_RESET] Email sent successfully to:', emailLower)
    } catch (emailError: any) {
      console.error('❌ [PASSWORD_RESET] Failed to send email:', emailError)
      console.error('[PASSWORD_RESET] Error details:', {
        message: emailError?.message,
        name: emailError?.name,
        stack: emailError?.stack
      })
      // Delete the token if email sending fails
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `password-reset:${emailLower}`,
          token: resetToken,
        }
      })
      // Still return success to user (don't reveal technical issues)
      return NextResponse.json({
        success: true,
        message: 'Se questa email è registrata, riceverai un link per reimpostare la password.'
      })
    }

    // Return success (don't reveal if email exists or not for security)
    return NextResponse.json({
      success: true,
      message: 'Se questa email è registrata, riceverai un link per reimpostare la password.'
    })

  } catch (error) {
    console.error('[PASSWORD_RESET] Error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
