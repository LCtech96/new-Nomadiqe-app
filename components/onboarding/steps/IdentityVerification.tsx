'use client'

import { useState } from 'react'
import { useOnboarding, useOnboardingApi } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, FileText, AlertCircle, CheckCircle, Camera, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getNextStep } from '@/lib/onboarding'

interface FormData {
  documentType: 'passport' | 'drivers_license' | 'national_id'
  documentNumber: string
  skipVerification: boolean
}

interface FormErrors {
  documentNumber?: string
  general?: string
}

const documentTypes = [
  {
    id: 'passport' as const,
    label: 'Passport',
    icon: FileText,
    description: 'International travel document'
  },
  {
    id: 'drivers_license' as const,
    label: "Driver's License",
    icon: Camera,
    description: 'Government-issued driving license'
  },
  {
    id: 'national_id' as const,
    label: 'National ID',
    icon: Shield,
    description: 'National identification card'
  }
]

interface IdentityVerificationProps {
  userType?: 'host' | 'influencer' | 'traveler'
  onComplete?: () => void
}

export default function IdentityVerification({ userType, onComplete }: IdentityVerificationProps) {
  const { role, completeStep, setStep } = useOnboarding()
  const { verifyIdentity } = useOnboardingApi()
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    documentType: 'passport',
    documentNumber: '',
    skipVerification: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'Document number is required'
    } else if (formData.documentNumber.length < 3) {
      newErrors.documentNumber = 'Document number must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (skipVerification = false) => {
    if (!skipVerification && !validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await verifyIdentity({
        documentType: skipVerification ? undefined : formData.documentType,
        documentNumber: skipVerification ? undefined : formData.documentNumber,
        skipVerification
      })

      setVerificationResult(result)

      if (result.status === 'VERIFIED' || skipVerification) {
        completeStep('identity-verification')
        // Redirect to appropriate step based on role
        let nextStep = 'complete'
        if (role === 'HOST') {
          nextStep = 'listing-creation'
        } else if (role === 'INFLUENCER') {
          nextStep = 'social-connect'
        } else if (role === 'TRAVELER') {
          nextStep = 'complete'
        }
        
        if (result.nextStep) {
          nextStep = result.nextStep
        }
        
        setStep(nextStep)
        
        if (onComplete) {
          onComplete()
        } else {
          router.push(`/onboarding/${nextStep}`)
        }
      }
    } catch (error: any) {
      setErrors({
        general: error.message || 'Verification failed. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Show result if verification is pending
  if (verificationResult && verificationResult.status === 'PENDING') {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-yellow-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Verification in Progress
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {verificationResult.message}
          </p>
        </div>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              <strong>Verification ID:</strong> {verificationResult.verificationId}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              We&#39;ll notify you via email once the verification is complete. 
              This usually takes 1-2 business days.
            </p>
          </CardContent>
        </Card>

        <Button onClick={() => router.push('/dashboard')}>
          Continue to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Verify Your Identity
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {userType === 'host' 
            ? 'To ensure the safety of our community, we need to verify your identity before you can list properties.'
            : userType === 'influencer'
            ? 'Identity verification helps build trust with hosts and ensures authentic collaborations.'
            : 'Identity verification helps ensure a safe and trusted community for all travelers.'
          }
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">
          Select Document Type *
        </label>
        
        <div className="grid gap-3">
          {documentTypes.map((type) => {
            const Icon = type.icon
            const isSelected = formData.documentType === type.id
            
            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
                }`}
                onClick={() => handleInputChange('documentType', type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}>
                        {type.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Document Number Input */}
      <div className="space-y-2">
        <label htmlFor="documentNumber" className="text-sm font-medium text-foreground">
          Document Number *
        </label>
        <Input
          id="documentNumber"
          type="text"
          value={formData.documentNumber}
          onChange={(e) => handleInputChange('documentNumber', e.target.value)}
          placeholder="Enter your document number"
          className={errors.documentNumber ? 'border-red-500 focus:border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.documentNumber && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.documentNumber}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          This information is encrypted and stored securely. We only use it for identity verification.
        </p>
      </div>

      {/* File Upload Placeholder */}
      <Card className="border-dashed border-2 border-border">
        <CardContent className="p-6 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Document Upload (Coming Soon)
          </p>
          <p className="text-xs text-muted-foreground">
            In the full version, you&#39;ll be able to upload a photo of your document for faster verification.
          </p>
        </CardContent>
      </Card>

      {/* General Error */}
      {errors.general && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {errors.general}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push('/onboarding/role-selection')}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Skip for Now
          </Button>
        </div>

        <Button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || !formData.documentNumber.trim()}
          className="px-8"
        >
          {isSubmitting ? 'Verifying...' : 'Verify Identity'}
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="bg-nomadiqe-success/10 border-nomadiqe-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-nomadiqe-success flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Your Data is Secure
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-nomadiqe-success">
            We use bank-level encryption to protect your personal information. 
            Your document details are never shared with other users and are only used for verification purposes.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
