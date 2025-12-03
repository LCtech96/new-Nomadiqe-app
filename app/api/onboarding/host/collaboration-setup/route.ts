import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { awardPoints } from '@/lib/services/points-service'

const collaborationSchema = z.object({
  standardOffer: z.object({
    offerType: z.enum(['free_stay', 'discounted_stay', 'paid_collaboration']),
    discount: z.number().min(0).max(100).optional(),
    minNights: z.number().min(1, 'Minimum 1 night required').max(30).default(1),
    maxNights: z.number().min(1).max(30).default(7),
    deliverables: z.array(z.string()).min(1, 'At least one deliverable is required'),
    terms: z.string().min(10, 'Terms must be at least 10 characters')
  }),
  minFollowerCount: z.number().min(1000, 'Minimum follower count should be at least 1000').optional(),
  preferredNiches: z.array(z.string()).max(10, 'Maximum 10 niches allowed').optional()
})

const AVAILABLE_NICHES = [
  'travel',
  'lifestyle',
  'food',
  'fashion',
  'photography',
  'adventure',
  'luxury',
  'budget',
  'family',
  'couple',
  'solo',
  'business',
  'wellness',
  'culture',
  'nature'
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is a host
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { hostProfile: true }
    })

    if (!user) {
      console.error('[Collaboration Setup] User not found:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check role - if not HOST but has hostProfile, allow but log warning
    if (user.role !== 'HOST') {
      // If user has hostProfile but wrong role, fix the role and allow
      if (user.hostProfile) {
        console.warn('[Collaboration Setup] Role mismatch but hostProfile exists:', {
          userId: session.user.id,
          expectedRole: 'HOST',
          actualRole: user.role,
          action: 'Fixing role and allowing request'
        })
        // Fix the role in the database
        user = await prisma.user.update({
          where: { id: session.user.id },
          data: { role: 'HOST' },
          include: { hostProfile: true }
        })
      } else {
        console.error('[Collaboration Setup] Role mismatch and no hostProfile:', {
          userId: session.user.id,
          expectedRole: 'HOST',
          actualRole: user.role,
          userRoleType: typeof user.role
        })
        return NextResponse.json(
          { error: 'This endpoint is only for hosts' },
          { status: 403 }
        )
      }
    }

    // Create hostProfile if it doesn't exist (defensive check)
    if (!user.hostProfile) {
      const referralCode = `HOST_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      await prisma.hostProfile.create({
        data: {
          userId: session.user.id,
          referralCode,
          preferredNiches: []
        }
      })
      // Refresh user object to include the newly created hostProfile
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { hostProfile: true }
      })
      if (!user?.hostProfile) {
        return NextResponse.json(
          { error: 'Failed to create host profile' },
          { status: 500 }
        )
      }
    }

    const body = await req.json()
    const validatedData = collaborationSchema.parse(body)

    // Validate niches are from allowed list
    if (validatedData.preferredNiches) {
      const invalidNiches = validatedData.preferredNiches.filter(
        niche => !AVAILABLE_NICHES.includes(niche.toLowerCase())
      )
      
      if (invalidNiches.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid niches selected',
            details: { invalidNiches, availableNiches: AVAILABLE_NICHES }
          },
          { status: 400 }
        )
      }
    }

    // Update host profile with collaboration preferences
    await prisma.hostProfile.update({
      where: { userId: session.user.id },
      data: {
        standardOffer: validatedData.standardOffer,
        minFollowerCount: validatedData.minFollowerCount,
        preferredNiches: validatedData.preferredNiches || []
      }
    })

    // Complete onboarding for host
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStatus: 'COMPLETED',
        onboardingStep: null
      }
    })

    // Award onboarding completion points
    await awardPoints({
      userId: session.user.id,
      action: 'onboarding_complete',
      description: 'Host onboarding completed successfully!',
    })

    // Update progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id }
    })

    if (progress) {
      const completedSteps = JSON.parse(progress.completedSteps as string)
      completedSteps.push('collaboration-setup')
      
      await prisma.onboardingProgress.update({
        where: { userId: session.user.id },
        data: {
          currentStep: 'completed',
          completedSteps: JSON.stringify(completedSteps),
          completedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      onboardingComplete: true,
      redirectTo: '/dashboard/host',
      message: 'Host onboarding completed successfully! Welcome to Nomadiqe.',
      referralCode: user.hostProfile.referralCode
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid collaboration data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Collaboration setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup collaboration preferences' },
      { status: 500 }
    )
  }
}
