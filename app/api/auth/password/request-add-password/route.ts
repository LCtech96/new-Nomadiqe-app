import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendAddPasswordEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * POST /api/auth/password/request-add-password
 * Request to add password to OAuth-only account (via email verification)
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        password: true,
      }
    })

    // Don't reveal if user exists (security best practice)
    // But in this case, we want to help OAuth-only users, so we'll be more specific
    if (!user) {
      console.log('[ADD_PASSWORD_REQUEST] User not found:', emailLower)
      return NextResponse.json(
        { error: 'Nessun account trovato con questa email. Verifica che sia corretta.' },
        { status: 404 }
      )
    }

    // Check if user already has a password
    if (user.password) {
      console.log('[ADD_PASSWORD_REQUEST] User already has password:', emailLower)
      return NextResponse.json(
        { error: 'Questo account ha già una password. Usa "Password dimenticata" se vuoi resettarla.' },
        { status: 400 }
      )
    }

    // Check which OAuth providers are linked
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { provider: true }
    })
    
    const oauthProviders = accounts.map((acc: { provider: string }) => acc.provider)
    console.log('[ADD_PASSWORD_REQUEST] OAuth-only account found:', {
      email: emailLower,
      providers: oauthProviders
    })

    // Generate secure random token
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
    // Using verification_tokens table with identifier format: "add-password:email"
    await prisma.verificationToken.create({
      data: {
        identifier: `add-password:${emailLower}`,
        token: addPasswordToken,
        expires: expiresAt,
      }
    })

    console.log('[ADD_PASSWORD_REQUEST] Token generated for:', emailLower)
    console.log('[ADD_PASSWORD_REQUEST] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)

    // Send email with link to add password
    try {
      await sendAddPasswordEmail(emailLower, addPasswordToken)
      console.log('[ADD_PASSWORD_REQUEST] Email sent successfully to:', emailLower)
    } catch (emailError: any) {
      console.error('[ADD_PASSWORD_REQUEST] Failed to send email:', emailError)
      // Don't fail the request if email fails - log it but still return success
      // This prevents revealing email delivery issues
    }

    return NextResponse.json({
      success: true,
      message: 'Se questa email è registrata come account OAuth-only, riceverai un link per aggiungere una password.',
      // In development, we can provide more info
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          email: emailLower,
          hasToken: true,
          expiresAt: expiresAt.toISOString()
        }
      })
    })

  } catch (error: any) {
    console.error('[ADD_PASSWORD_REQUEST] Error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}

