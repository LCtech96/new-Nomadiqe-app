import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/kolbed/track-click
 * Track quando un utente clicca su un link referral di un creator
 * Questo endpoint viene chiamato quando un traveler arriva da un link social
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { referralCode, landingPage } = body

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Find creator by referral code
    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { referralCode },
      include: { user: true }
    })

    if (!influencerProfile) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Get IP and user agent from request
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Create referral click record
    const referralClick = await prisma.referralClick.create({
      data: {
        referralCode,
        creatorId: influencerProfile.userId,
        ipAddress,
        userAgent,
        landingPage: landingPage || '/',
      }
    })

    console.log('[KOLBED] Referral click tracked:', {
      clickId: referralClick.id,
      creatorId: influencerProfile.userId,
      creatorName: influencerProfile.user.name,
      referralCode
    })

    // Store referralCode in session/cookie for later booking tracking
    const response = NextResponse.json({
      success: true,
      tracked: true,
      creatorName: influencerProfile.user.fullName || influencerProfile.user.name
    })

    // Set cookie to remember referral for future booking
    response.cookies.set('nomadiqe_referral', referralCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Track referral click error:', error)
    return NextResponse.json(
      { error: 'Failed to track referral click' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/kolbed/track-click?referralCode=XYZ123
 * Redirect e track in un solo step
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const referralCode = searchParams.get('ref') || searchParams.get('referralCode')
    const landingPage = searchParams.get('page') || '/'

    if (!referralCode) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Track the click
    await POST(new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ referralCode, landingPage }),
      headers: req.headers
    }))

    // Redirect to landing page
    const redirectUrl = new URL(landingPage, req.url)
    redirectUrl.searchParams.set('ref', referralCode)
    
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Track referral GET error:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

