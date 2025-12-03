'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useOnboarding, useOnboardingApi } from '@/contexts/OnboardingContext'
import { getNextStep } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Camera, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SingleImageUpload } from '@/components/ui/single-image-upload'

interface FormData {
  fullName: string
  username: string
  profilePicture: string
  bio: string
}

interface FormErrors {
  fullName?: string
  username?: string
  bio?: string
  general?: string
}

interface ProfileSetupProps {
  onNext?: () => void
}

export default function ProfileSetup({ onNext }: ProfileSetupProps = {}) {
  const { data: session, update: updateSession } = useSession()
  const { error, setError, setStep, completeStep, progress } = useOnboarding()
  const { updateProfile, fetchProgress } = useOnboardingApi()
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    profilePicture: session?.user?.image || '',
    bio: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const hasLoadedDataRef = useRef(false)

  // Fetch and pre-fill user data on mount
  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (hasLoadedDataRef.current) {
      return
    }

    const loadUserData = async () => {
      hasLoadedDataRef.current = true
      setIsLoadingData(true)
      try {
        const progressData = await fetchProgress()
        if (progressData?.userData) {
          setFormData({
            fullName: progressData.userData.fullName || '',
            username: progressData.userData.username || '',
            profilePicture: progressData.userData.profilePictureUrl || session?.user?.image || '',
            bio: progressData.userData.bio || ''
          })
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        hasLoadedDataRef.current = false // Allow retry on error
      } finally {
        setIsLoadingData(false)
      }
    }

    loadUserData()
  }, [fetchProgress, session?.user?.image])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(undefined)
    
    if (!validateForm()) {
      return false
    }

    setIsSubmitting(true)

    try {
      // Only include profilePicture if it's a valid non-empty URL
      const profilePictureUrl = formData.profilePicture?.trim() || ''
      const hasValidProfilePicture = profilePictureUrl.length > 0 && 
        (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://'))
      
      console.log('[ProfileSetup] Submitting profile:', {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        hasProfilePicture: hasValidProfilePicture,
        profilePictureLength: profilePictureUrl.length
      })
      
      const result = await updateProfile({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        profilePicture: hasValidProfilePicture ? profilePictureUrl : undefined
      })

      if (result.success) {
        // Update context first
        completeStep('profile-setup')
        setStep(result.nextStep)
        
        // Update the session token with fresh data from database
        await updateSession()
        
        // Small delay to ensure session is fully updated
        await new Promise(resolve => setTimeout(resolve, 300))

        // Call onNext if provided (for wizard integration)
        if (onNext) {
          onNext()
        } else {
          router.push(`/onboarding/${result.nextStep}`)
        }
        return true
      }
      return false
    } catch (error) {
      // Error already handled by the API hook
      console.error('Profile setup error:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Expose submit function for wizard to call
  const canProceed = formData.fullName.trim() && formData.username.trim() && !isSubmitting
  
  // Bio validation (optional, but if provided, max 500 chars)
  if (formData.bio.trim() && formData.bio.length > 500) {
    if (!errors.bio) {
      setErrors(prev => ({ ...prev, bio: 'Bio must be less than 500 characters' }))
    }
  } else if (errors.bio) {
    setErrors(prev => ({ ...prev, bio: undefined }))
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }))
    }
  }

  const handleUsernameChange = (value: string) => {
    // Convert to lowercase and remove invalid characters as user types
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    handleInputChange('username', cleanValue)
  }

  // Show loading state while fetching user data
  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div className="text-center">
        <SingleImageUpload
          value={formData.profilePicture}
          onChange={(url) => handleInputChange('profilePicture', url || '')}
          variant="avatar"
          size="lg"
          placeholder="Upload profile picture"
          disabled={isSubmitting}
          maxSizeInMB={5}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Upload a profile picture (optional)
        </p>
      </div>

      {/* Full Name Input */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Full Name *
        </label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          placeholder="Enter your full name"
          className={errors.fullName ? 'border-red-500 focus:border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Username Input */}
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-foreground">
          Username *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="choose_username"
            className={`pl-8 ${errors.username ? 'border-red-500 focus:border-red-500' : ''}`}
            disabled={isSubmitting}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.username}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          This will be your unique identifier on Nomadiqe. You can use letters, numbers, and underscores.
        </p>
      </div>

      {/* Bio Input */}
      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium text-foreground">
          Bio (Optional)
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us a bit about yourself..."
          rows={4}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-md resize-none ${
            errors.bio ? 'border-red-500 focus:border-red-500' : 'border-border'
          }`}
          disabled={isSubmitting}
        />
        {errors.bio && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.bio}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.bio.length}/500 characters
        </p>
      </div>

      {/* General Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {/* No back button for profile setup - it's the first step */}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!canProceed}
          className="px-8"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-primary">
            Your profile information helps other users recognize and connect with you. 
            You can always update this information later in your account settings.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
