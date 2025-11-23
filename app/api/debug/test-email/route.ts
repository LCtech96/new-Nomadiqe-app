import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/email'

/**
 * POST /api/debug/test-email
 * Test email sending functionality
 */
export async function POST(request: NextRequest) {
  // Disable debug endpoints in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production'
    }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Check configuration
    const hasApiKey = !!process.env.RESEND_API_KEY
    const fromEmail = process.env.EMAIL_FROM || 'noreply@nomadiqe.com'

    const config = {
      hasResendApiKey: hasApiKey,
      fromEmail: fromEmail,
      nodeEnv: process.env.NODE_ENV
    }

    // Generate a test token
    const testToken = 'test-token-' + Date.now()

    // Try to send email
    try {
      await sendPasswordResetEmail(email, testToken)
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        config: config,
        note: hasApiKey 
          ? 'Email was sent via Resend API. Check your inbox (and spam folder).'
          : 'Email was logged to console (RESEND_API_KEY not configured)'
      }, { status: 200 })
    } catch (emailError: any) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: emailError?.message || 'Unknown error',
        config: config,
        details: emailError
      }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test email',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

