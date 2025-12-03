import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { awardPoints } from '@/lib/services/points-service'

const interestsSchema = z.object({
  interests: z.array(z.string().min(1)).max(20, 'Too many interests selected').default([])
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate and log user ID
    const userId = session.user.id
    console.log('[GUEST_INTERESTS] User ID from session:', {
      id: userId,
      type: typeof userId,
      length: userId?.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || ''),
    })

    // Verify user is a guest
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'TRAVELER') {
      return NextResponse.json(
        { error: 'This endpoint is only for travelers' },
        { status: 403 }
      )
    }

    const body = await req.json()
    console.log('[GUEST_INTERESTS] Received body:', body)
    
    const validatedData = interestsSchema.parse(body)
    console.log('[GUEST_INTERESTS] Validated data:', validatedData)

    // Update or create guest preferences
    console.log('[GUEST_INTERESTS] Upserting guest preferences...')
    await prisma.guestPreferences.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        travelInterests: validatedData.interests
      },
      update: {
        travelInterests: validatedData.interests
      }
    })
    console.log('[GUEST_INTERESTS] Guest preferences updated successfully')

    // Complete onboarding for guest
    console.log('[GUEST_INTERESTS] Completing onboarding...')
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: 'COMPLETED',
        onboardingStep: null
      }
    })
    console.log('[GUEST_INTERESTS] User onboarding status updated to COMPLETED')

    // Award onboarding completion points
    try {
      console.log('[GUEST_INTERESTS] Awarding points...')
      await awardPoints({
        userId: userId,
        action: 'onboarding_complete',
        description: 'Onboarding completed successfully!',
      })
      console.log('[GUEST_INTERESTS] Points awarded successfully')
    } catch (pointsError) {
      console.error('[GUEST_INTERESTS] Error awarding points (non-critical):', pointsError)
      // Don't fail the request if points service fails
    }

    // Update progress
    console.log('[GUEST_INTERESTS] Updating onboarding progress...')
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: userId }
    })

    if (progress) {
      const completedSteps = JSON.parse(progress.completedSteps as string)
      completedSteps.push('interest-selection')
      
      console.log('[GUEST_INTERESTS] Updating progress with completed steps:', completedSteps)
      await prisma.onboardingProgress.update({
        where: { userId: userId },
        data: {
          currentStep: 'completed',
          completedSteps: JSON.stringify(completedSteps),
          completedAt: new Date()
        }
      })
      console.log('[GUEST_INTERESTS] Progress updated successfully')
    } else {
      console.warn('[GUEST_INTERESTS] No onboarding progress found for user')
    }

    return NextResponse.json({
      success: true,
      onboardingComplete: true,
      redirectTo: '/dashboard/guest'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[GUEST_INTERESTS] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[GUEST_INTERESTS] Guest interests error:', error)
    console.error('[GUEST_INTERESTS] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[GUEST_INTERESTS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: 500 }
    )
  }
}
