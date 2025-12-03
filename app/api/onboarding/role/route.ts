import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const roleSchema = z.object({
  role: z.enum(['TRAVELER', 'HOST', 'INFLUENCER'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  })
})

const getNextStep = (role: string): string => {
  // After role selection, go to profile setup first
  // Flow: Welcome → Role Selection → Profile Setup → Role-Specific Steps → Complete
  // Profile setup comes after role selection, so return 'profile-setup'
  return 'profile-setup'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = roleSchema.parse(body)

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: validatedData.role,
        onboardingStep: getNextStep(validatedData.role)
      }
    })

    // Update onboarding progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id }
    })

    if (progress) {
      const completedSteps = JSON.parse(progress.completedSteps as string)
      completedSteps.push('role-selection')
      
      await prisma.onboardingProgress.update({
        where: { userId: session.user.id },
        data: {
          currentStep: getNextStep(validatedData.role),
          completedSteps: JSON.stringify(completedSteps)
        }
      })
    }

    // Create role-specific profile if needed
    try {
      if (validatedData.role === 'HOST') {
        // Check if host profile already exists
        const existingHostProfile = await prisma.hostProfile.findUnique({
          where: { userId: session.user.id }
        })
        
        if (!existingHostProfile) {
          // Generate unique referral code
          const referralCode = `HOST_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
          
          await prisma.hostProfile.create({
            data: {
              userId: session.user.id,
              referralCode,
              preferredNiches: [] // Initialize as empty array
            }
          })
        }
      } else if (validatedData.role === 'INFLUENCER') {
        // Check if influencer profile already exists
        const existingInfluencerProfile = await prisma.influencerProfile.findUnique({
          where: { userId: session.user.id }
        })
        
        if (!existingInfluencerProfile) {
          await prisma.influencerProfile.create({
            data: {
              userId: session.user.id,
              contentNiches: [] // Will be filled during profile setup
            }
          })
        }
      } else if (validatedData.role === 'TRAVELER') {
        // Check if traveler preferences already exist (guest preferences for travelers)
        const existingGuestPrefs = await prisma.guestPreferences.findUnique({
          where: { userId: session.user.id }
        })
        
        if (!existingGuestPrefs) {
          await prisma.guestPreferences.create({
            data: {
              userId: session.user.id,
              travelInterests: []
            }
          })
        }
      }
    } catch (profileError) {
      console.error('Error creating role-specific profile:', profileError)
      // Continue anyway - profile can be created later
    }

    return NextResponse.json({
      success: true,
      nextStep: getNextStep(validatedData.role),
      role: validatedData.role
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role selected', code: 'ONBOARDING_006' },
        { status: 400 }
      )
    }

    console.error('Role selection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
