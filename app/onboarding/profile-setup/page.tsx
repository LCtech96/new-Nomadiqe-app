import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

async function OnboardingProfileSetupPageContent() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has selected a role
  // If not, redirect to role-selection first
  // Flow: Welcome → Role Selection → Profile Setup → Role-Specific Steps → Complete
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, onboardingStep: true }
  })

  // If user doesn't have a role selected (or role is not TRAVELER, HOST, or INFLUENCER), redirect to role-selection
  if (!user || !user.role || !['TRAVELER', 'HOST', 'INFLUENCER'].includes(user.role)) {
    console.log('[Profile Setup Page] User has no valid role, redirecting to role-selection:', {
      userId: session.user.id,
      currentRole: user?.role
    })
    redirect('/onboarding/role-selection')
  }

  return <OnboardingFlow step="profile-setup" />
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}

export default function OnboardingProfileSetupPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OnboardingProfileSetupPageContent />
    </Suspense>
  )
}
