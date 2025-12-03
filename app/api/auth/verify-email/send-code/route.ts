import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendVerificationCodeEmail } from '@/lib/email'

/**
 * POST /api/auth/verify-email/send-code
 * Sends a 6-digit verification code to the user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
      console.log('[VERIFY_EMAIL] User already exists:', emailLower)
      return NextResponse.json(
        { message: 'Un utente con questa email esiste già. Se hai già un account, vai alla pagina di accesso.' },
        { status: 400 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Delete any existing verification codes for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `email-verification:${emailLower}`,
      }
    })

    // Save code to database
    await prisma.verificationToken.create({
      data: {
        identifier: `email-verification:${emailLower}`,
        token: code,
        expires: expiresAt,
      }
    })

    console.log('[VERIFY_EMAIL] Code generated for:', emailLower)

    // Send email with code
    try {
      await sendVerificationCodeEmail(emailLower, code)
      console.log('[VERIFY_EMAIL] Email sent successfully to:', emailLower)
    } catch (emailError: any) {
      console.error('[VERIFY_EMAIL] Failed to send email:', emailError)
      // Still return success to avoid revealing email delivery issues
    }

    return NextResponse.json({
      success: true,
      message: 'Codice di verifica inviato alla tua email',
    })
  } catch (error) {
    console.error('[VERIFY_EMAIL] Error:', error)
    return NextResponse.json(
      { message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

