import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  profilePicture: z.union([
    z.string().url(),
    z.string().length(0),
    z.undefined()
  ]).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
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
    console.log('[PROFILE] User ID from session:', {
      id: userId,
      type: typeof userId,
      length: userId?.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || ''),
      firstChars: userId?.substring(0, 10)
    })

    // Validate that userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error('[PROFILE] Invalid user ID format:', userId)
      return NextResponse.json(
        { error: 'Invalid user ID format. Please log out and log in again.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    console.log('[PROFILE] Received body:', { 
      fullName: body.fullName, 
      username: body.username, 
      hasProfilePicture: !!body.profilePicture,
      profilePictureLength: body.profilePicture?.length || 0,
      hasBio: !!body.bio,
      bioLength: body.bio?.length || 0
    })
    
    const validatedData = profileSchema.parse(body)
    console.log('[PROFILE] Validated data:', { 
      fullName: validatedData.fullName, 
      username: validatedData.username, 
      hasProfilePicture: !!validatedData.profilePicture 
    })

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Username already taken', code: 'ONBOARDING_001' },
        { status: 400 }
      )
    }

    // After profile setup, go to role-specific steps
    // Flow: Welcome → Role Selection → Profile Setup → Role-Specific Steps → Complete
    // First, get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    const userRole = user?.role || 'TRAVELER'
    let nextStep = 'complete'
    
    if (userRole === 'TRAVELER') {
      nextStep = 'interest-selection'
    } else if (userRole === 'HOST') {
      nextStep = 'listing-creation' // Then collaboration-setup
    } else if (userRole === 'INFLUENCER') {
      nextStep = 'social-connect' // Then media-kit-setup
    }

    // Update user profile
    const updateData: any = {
      fullName: validatedData.fullName,
      username: validatedData.username,
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: nextStep // Set to the next role-specific step
    }
    
    // Only update profilePictureUrl if it's provided and not empty
    if (validatedData.profilePicture && validatedData.profilePicture.trim() !== '') {
      updateData.profilePictureUrl = validatedData.profilePicture
    }
    
    // Update bio if provided
    if (validatedData.bio !== undefined) {
      updateData.bio = validatedData.bio.trim() || null
    }
    
    console.log('[PROFILE] Updating user with data:', { 
      userId: userId, 
      updateData 
    })
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
    
    console.log('[PROFILE] User updated successfully:', { 
      id: updatedUser.id, 
      username: updatedUser.username 
    })

    // Update or create onboarding progress
    console.log('[PROFILE] Upserting onboarding progress:', {
      userId: userId,
      userIdType: typeof userId,
      userIdIsUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId),
      nextStep
    })
    
    await prisma.onboardingProgress.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        currentStep: nextStep,
        completedSteps: JSON.stringify(['profile-setup'])
      },
      update: {
        currentStep: nextStep,
        completedSteps: JSON.stringify(['profile-setup'])
      }
    })
    
    console.log('[PROFILE] Onboarding progress updated successfully')

    return NextResponse.json({
      success: true,
      nextStep,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        profilePictureUrl: updatedUser.profilePictureUrl
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[PROFILE] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[PROFILE] Profile setup error:', error)
    console.error('[PROFILE] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[PROFILE] Error details:', {
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
