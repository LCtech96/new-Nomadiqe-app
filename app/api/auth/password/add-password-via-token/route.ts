import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/password/add-password-via-token
 * Add password to OAuth-only account using token from email
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token di verifica richiesto' },
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
        { error: 'Password richiesta' },
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
          identifier: `add-password:${emailLower}`,
          token: token,
        }
      }
    })

    // Check if token exists
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto. Richiedi un nuovo link.' },
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
        { error: 'Token scaduto. Richiedi un nuovo link.' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: { 
        id: true, 
        email: true,
        password: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Check if user already has a password
    if (user.password) {
      // Delete used token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          }
        }
      })
      
      return NextResponse.json(
        { error: 'Questo account ha già una password. Usa "Password dimenticata" se vuoi resettarla.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user with password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      }
    })

    console.log('[ADD_PASSWORD_TOKEN] Password added successfully for OAuth-only account:', emailLower)

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        }
      }
    })

    // Also delete any other add-password tokens for this email (cleanup)
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `add-password:${emailLower}`,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password aggiunta con successo! Ora puoi accedere con email e password oppure continuare a usare Google/Facebook/Apple.'
    })

  } catch (error: any) {
    console.error('[ADD_PASSWORD_TOKEN] Error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}

