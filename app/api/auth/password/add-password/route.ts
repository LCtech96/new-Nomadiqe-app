import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/password/add-password
 * Add password to an OAuth-only account (user must be logged in)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Devi essere autenticato per aggiungere una password' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    // Validate input
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

    const emailLower = session.user.email.toLowerCase()

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

    console.log('[ADD_PASSWORD] Password added successfully for OAuth-only account:', emailLower)

    return NextResponse.json({
      success: true,
      message: 'Password aggiunta con successo. Ora puoi accedere anche con email/password.'
    })

  } catch (error) {
    console.error('[ADD_PASSWORD] Error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}

