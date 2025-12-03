import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/auth/verify-email/verify-code
 * Verifies the email verification code
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email e codice sono richiesti' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const codeString = code.toString().trim()

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `email-verification:${emailLower}`,
          token: codeString,
        }
      }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { message: 'Codice di verifica non valido' },
        { status: 400 }
      )
    }

    // Check if code is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `email-verification:${emailLower}`,
            token: codeString,
          }
        }
      })
      return NextResponse.json(
        { message: 'Codice di verifica scaduto. Richiedi un nuovo codice.' },
        { status: 400 }
      )
    }

    // Code is valid - delete it (one-time use)
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `email-verification:${emailLower}`,
          token: codeString,
        }
      }
    })

    console.log('[VERIFY_EMAIL] Code verified successfully for:', emailLower)

    return NextResponse.json({
      success: true,
      message: 'Email verificata con successo',
    })
  } catch (error) {
    console.error('[VERIFY_EMAIL] Error:', error)
    return NextResponse.json(
      { message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}




