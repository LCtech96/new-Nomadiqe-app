'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { OnboardingProvider, useOnboarding, useOnboardingApi } from '@/contexts/OnboardingContext'
import OnboardingWizard from './OnboardingWizard'
import ProfileSetup from './steps/ProfileSetup'
import RoleSelection from './steps/RoleSelection'
import InterestSelection from './steps/guest/InterestSelection'
import IdentityVerification from './steps/IdentityVerification'
import ListingWizard from './steps/host/ListingWizard'
import CollaborationSetup from './steps/host/CollaborationSetup'
import SocialMediaConnect from './steps/influencer/SocialMediaConnect'
import ProfileMediaKit from './steps/influencer/ProfileMediaKit'
import { getPreviousStep, getNextStep } from '@/lib/onboarding'

interface OnboardingFlowProps {
  step: string
}

function OnboardingStepRenderer({ step }: { step: string }) {
  const { role } = useOnboarding()

  switch (step) {
    case 'welcome':
      return <WelcomeStep />
    case 'profile-setup':
      return <ProfileSetup />
    case 'role-selection':
      return <RoleSelection />
    case 'interest-selection':
      return <InterestSelection />
    case 'identity-verification':
      return (
        <IdentityVerification 
          userType={role === 'HOST' ? 'host' : role === 'INFLUENCER' ? 'influencer' : 'traveler'} 
        />
      )
    case 'listing-creation':
      return <ListingWizard />
    case 'collaboration-setup':
      return <CollaborationSetup />
    case 'social-connect':
      return <SocialMediaConnect />
    case 'media-kit-setup':
      return <ProfileMediaKit />
    case 'complete':
      return <OnboardingComplete />
    default:
      return <ProfileSetup />
  }
}

function WelcomeStep() {
  const { data: session } = useSession()
  const { setStep } = useOnboarding()
  const router = useRouter()

  const handleGetStarted = () => {
    setStep('role-selection')
    router.push('/onboarding/role-selection')
  }

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          Welcome to Nomadiqe! 👋
        </h2>
        <p className="text-lg text-muted-foreground">
          Hi {session?.user?.name?.split(' ')[0] || 'there'}! Let&apos;s get you set up in just a few quick steps.
        </p>
      </div>

      <div className="bg-muted p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-2">What to expect:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
          <li>• Set up your profile (2 minutes)</li>
          <li>• Choose your role on the platform</li>
          <li>• Customize your experience</li>
          <li>• Start connecting with the community</li>
        </ul>
      </div>

      <button
        onClick={handleGetStarted}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-lg transition-colors"
      >
        Get Started
      </button>
    </div>
  )
}

function OnboardingComplete() {
  const { role } = useOnboarding()
  const router = useRouter()

  const getDashboardInfo = () => {
    switch (role) {
      case 'HOST':
        return {
          url: '/dashboard/host',
          title: 'Welcome to Nomadiqe Host Community!',
          description: 'Your host account is ready. Start managing your properties and welcoming guests!',
          emoji: '🏠'
        }
      case 'INFLUENCER':
        return {
          url: '/dashboard/influencer',
          title: 'Your Influencer Profile is Live!',
          description: 'Start collaborating with amazing hosts and sharing your travel experiences!',
          emoji: '✨'
        }
      case 'TRAVELER':
        return {
          url: '/dashboard/guest',
          title: 'Welcome to Nomadiqe!',
          description: 'Your account is ready. Start discovering amazing places and unique experiences!',
          emoji: '🌍'
        }
      default:
        return {
          url: '/dashboard',
          title: 'Welcome to Nomadiqe!',
          description: 'Your account has been set up successfully. You\'re ready to start exploring!',
          emoji: '🎉'
        }
    }
  }

  const dashboardInfo = getDashboardInfo()

  const handleGoToDashboard = () => {
    router.push(dashboardInfo.url)
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">{dashboardInfo.emoji}</div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          {dashboardInfo.title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {dashboardInfo.description}
        </p>
      </div>

      <button
        onClick={handleGoToDashboard}
        className="bg-nomadiqe-success hover:bg-nomadiqe-success/90 text-white font-medium py-3 px-8 rounded-lg transition-colors"
      >
        Go to {role ? `${role.charAt(0) + role.slice(1).toLowerCase()} ` : ''}Dashboard
      </button>
    </div>
  )
}

function OnboardingFlowContent({ step }: OnboardingFlowProps) {
  const { setStep, role, completedSteps, setRole, setProgress } = useOnboarding()
  const { fetchProgress } = useOnboardingApi()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize context with server data on mount
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        const progress = await fetchProgress()
        // Context is now populated with correct role and completed steps
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize onboarding progress:', error)
        // Still mark as initialized to allow rendering
        setIsInitialized(true)
      }
    }

    initializeProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - fetchProgress is stable from context

  // Sync the current step with the page prop
  useEffect(() => {
    if (isInitialized && step !== 'welcome') {
      setStep(step)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isInitialized]) // setStep is stable but can't be in deps due to context recreation

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const handleNext = async () => {
    // Most steps handle their own navigation
    // This is mainly for steps that need wizard navigation
    // Flow: Welcome → Role Selection → Profile Setup → Role-Specific Steps → Complete
    if (step === 'welcome') {
      setStep('role-selection')
      router.push('/onboarding/role-selection')
    } else if (role) {
      const nextStep = getNextStep(step, role)
      setStep(nextStep)
      
      if (nextStep === 'complete') {
        // Handle completion based on role
        const dashboardUrl = getDashboardUrl(role)
        router.push(dashboardUrl)
      } else {
        router.push(`/onboarding/${nextStep}`)
      }
    }
  }

  const handlePrevious = async () => {
    if (role) {
      const previousStep = getPreviousStep(step, role)
      setStep(previousStep)
      router.push(`/onboarding/${previousStep}`)
    }
  }

  const getDashboardUrl = (userRole: string) => {
    switch (userRole) {
      case 'HOST':
        return '/dashboard/host'
      case 'INFLUENCER':
        return '/dashboard/influencer'
      case 'TRAVELER':
        return '/dashboard/guest'
      default:
        return '/dashboard'
    }
  }

  const canProceed = () => {
    // Check if current step allows proceeding
    switch (step) {
      case 'profile-setup':
        // Will be validated by the ProfileSetup component
        return true
      case 'role-selection':
        // Role must be selected and be a valid onboarding role
        return !!role && ['TRAVELER', 'HOST', 'INFLUENCER'].includes(role.toUpperCase())
      default:
        return true
    }
  }

  const isLastStep = step === 'complete'
  // Steps handle their own navigation, wizard only shows header/progress
  const showNavigation = false

  return (
    <OnboardingWizard
      canProceed={canProceed()}
      onNext={handleNext}
      onPrevious={handlePrevious}
      showNavigation={showNavigation}
      isLastStep={isLastStep}
    >
      <OnboardingStepRenderer step={step} />
    </OnboardingWizard>
  )
}

export default function OnboardingFlow({ step }: OnboardingFlowProps) {
  return (
    <OnboardingProvider>
      <OnboardingFlowContent step={step} />
    </OnboardingProvider>
  )
}
