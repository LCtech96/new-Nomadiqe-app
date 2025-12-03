import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const verificationSchema = z.object({
  documentType: z.enum(['passport', 'drivers_license', 'national_id']).optional(),
  documentNumber: z.string().optional(),
  skipVerification: z.boolean().optional().default(false)
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

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        hostProfile: true,
        influencerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Allow HOST, TRAVELER, and INFLUENCER to skip verification
    if (!['HOST', 'TRAVELER', 'INFLUENCER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'This endpoint is only for hosts, travelers, and influencers' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = verificationSchema.parse(body)

    // If skipVerification is true, allow skipping for all roles
    if (validatedData.skipVerification) {
      const verificationId = `verify_${user.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Determine next step based on role
      let nextStep = 'complete'
      if (user.role === 'HOST') {
        nextStep = 'listing-creation'
      } else if (user.role === 'INFLUENCER') {
        nextStep = 'social-connect'
      } else if (user.role === 'TRAVELER') {
        // TRAVELER doesn't need identity verification, but if they reach here, go to complete
        nextStep = 'complete'
      }

      // Update profile if exists (for HOST and INFLUENCER)
      if (user.role === 'HOST' && user.hostProfile) {
        await prisma.hostProfile.update({
          where: { userId: session.user.id },
          data: {
            verificationStatus: 'VERIFIED',
            identityVerified: true,
            verificationDate: new Date()
          }
        })
      } else if (user.role === 'INFLUENCER' && user.influencerProfile) {
        await prisma.influencerProfile.update({
          where: { userId: session.user.id },
          data: {
            verificationStatus: 'VERIFIED',
            identityVerified: true,
            verificationDate: new Date()
          }
        })
      }

      // Update user onboarding step
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          onboardingStep: nextStep
        }
      })

      // Update progress
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId: session.user.id }
      })

      if (progress) {
        const completedSteps = JSON.parse(progress.completedSteps as string)
        completedSteps.push('identity-verification')
        
        await prisma.onboardingProgress.update({
          where: { userId: session.user.id },
          data: {
            currentStep: nextStep,
            completedSteps: JSON.stringify(completedSteps),
            metadata: {
              ...progress.metadata as object,
              verificationId,
              skipped: true
            }
          }
        })
      } else {
        // Create progress if it doesn't exist
        await prisma.onboardingProgress.create({
          data: {
            userId: session.user.id,
            currentStep: nextStep,
            completedSteps: JSON.stringify(['identity-verification']),
            metadata: {
              verificationId,
              skipped: true
            }
          }
        })
      }

      return NextResponse.json({
        verificationId,
        status: 'VERIFIED',
        message: 'Identity verification skipped successfully',
        nextStep
      })
    }

    // If not skipping, validate document data
    if (!validatedData.documentType || !validatedData.documentNumber) {
      return NextResponse.json(
        { error: 'Document type and number are required when not skipping verification' },
        { status: 400 }
      )
    }

    // In production, integrate with identity verification service
    const verificationId = `verify_${user.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    let verificationStatus: 'PENDING' | 'VERIFIED' = 'PENDING'
    let identityVerified = false

    // For demo, mark as verified immediately
    verificationStatus = 'VERIFIED'
    identityVerified = true

    // Update profile if exists
    if (user.role === 'HOST' && user.hostProfile) {
      await prisma.hostProfile.update({
        where: { userId: session.user.id },
        data: {
          verificationStatus,
          identityVerified,
          verificationDate: identityVerified ? new Date() : null
        }
      })
    } else if (user.role === 'INFLUENCER' && user.influencerProfile) {
      await prisma.influencerProfile.update({
        where: { userId: session.user.id },
        data: {
          verificationStatus,
          identityVerified,
          verificationDate: identityVerified ? new Date() : null
        }
      })
    }

    // Determine next step
    let nextStep = 'complete'
    if (user.role === 'HOST') {
      nextStep = 'listing-creation'
    } else if (user.role === 'INFLUENCER') {
      nextStep = 'social-connect'
    }

    // Update user onboarding step
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextStep
      }
    })

    // Update progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id }
    })

    if (progress) {
      const completedSteps = JSON.parse(progress.completedSteps as string)
      if (identityVerified) {
        completedSteps.push('identity-verification')
      }
      
      await prisma.onboardingProgress.update({
        where: { userId: session.user.id },
        data: {
          currentStep: nextStep,
          completedSteps: JSON.stringify(completedSteps),
          metadata: {
            ...progress.metadata as object,
            verificationId
          }
        }
      })
    }

    return NextResponse.json({
      verificationId,
      status: verificationStatus,
      message: identityVerified 
        ? 'Identity verification completed successfully'
        : 'Identity verification initiated. You will be notified once complete.',
      nextStep
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Identity verification error:', error)
    return NextResponse.json(
      { error: 'Identity verification failed', code: 'ONBOARDING_003' },
      { status: 500 }
    )
  }
}




