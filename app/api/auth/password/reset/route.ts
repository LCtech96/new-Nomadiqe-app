import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/password/reset
 * Reset password using token from email
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token di reset richiesto' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email richiesta' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Nuova password richiesta' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Find and verify token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `password-reset:${emailLower}`,
          token: token,
        }
      }
    })

    // Check if token exists
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto. Richiedi un nuovo link di reset.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          }
        }
      })
      
      return NextResponse.json(
        { error: 'Token scaduto. Richiedi un nuovo link di reset.' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      }
    })

    console.log('[PASSWORD_RESET] Password updated successfully for:', emailLower)

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        }
      }
    })

    // Also delete any other reset tokens for this email (cleanup)
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${emailLower}`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reimpostata con successo. Puoi ora accedere con la nuova password.'
    })

  } catch (error) {
    console.error('[PASSWORD_RESET] Error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}

