'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useOnboarding, useOnboardingApi } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PROPERTY_AMENITIES } from '@/lib/onboarding'
import { Home, MapPin, Camera, Euro, Wifi, Car, Utensils, AlertCircle, Check, Plus, Minus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ui/image-upload'
import { getNextStep } from '@/lib/onboarding'

type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'BNB' | 'HOTEL' | 'HOSTEL' | 'CABIN' | 'COTTAGE' | 'LOFT' | 'CAMPER' | 'TENT' | 'OTHER'

interface FormData {
  title: string
  description: string
  location: {
    address: string
    city: string
    country: string
  }
  propertyType: PropertyType
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: Record<string, boolean>
  photos: string[]
  pricing: {
    basePrice: number
    cleaningFee: number
    currency: string
  }
  rules: string[]
}

interface FormErrors {
  [key: string]: string
}

const propertyTypes = [
  { id: 'APARTMENT' as PropertyType, label: 'Apartment', icon: Home },
  { id: 'HOUSE' as PropertyType, label: 'House', icon: Home },
  { id: 'VILLA' as PropertyType, label: 'Villa', icon: Home },
  { id: 'BNB' as PropertyType, label: 'Bed & Breakfast', icon: Home },
  { id: 'HOTEL' as PropertyType, label: 'Hotel Room', icon: Home },
  { id: 'HOSTEL' as PropertyType, label: 'Hostel', icon: Home },
  { id: 'CABIN' as PropertyType, label: 'Cabin', icon: Home },
  { id: 'COTTAGE' as PropertyType, label: 'Cottage', icon: Home },
  { id: 'LOFT' as PropertyType, label: 'Loft', icon: Home },
  { id: 'CAMPER' as PropertyType, label: 'Camper/RV', icon: Home },
  { id: 'TENT' as PropertyType, label: 'Tent/Camping', icon: Home },
  { id: 'OTHER' as PropertyType, label: 'Other', icon: Home }
]

const defaultRules = [
  'No smoking inside',
  'No parties or events',
  'Check-in after 3:00 PM',
  'Check-out before 11:00 AM',
  'Quiet hours: 10:00 PM - 8:00 AM'
]

interface ListingWizardProps {
  onComplete?: () => void
}

export default function ListingWizard({ onComplete }: ListingWizardProps) {
  const { update: updateSession } = useSession()
  const { role, completeStep, setStep } = useOnboarding()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState<'basic' | 'location' | 'details' | 'amenities' | 'photos' | 'pricing'>('basic')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: {
      address: '',
      city: '',
      country: ''
    },
    propertyType: 'APARTMENT',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: Object.keys(PROPERTY_AMENITIES).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
    photos: [],
    pricing: {
      basePrice: 100,
      cleaningFee: 25,
      currency: 'EUR'
    },
    rules: [...defaultRules]
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateNestedData = (key: keyof FormData, nestedKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as any),
        [nestedKey]: value
      }
    }))
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {}

    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) newErrors.title = 'Title is required'
        else if (formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters'
        
        if (!formData.description.trim()) newErrors.description = 'Description is required'
        else if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters'
        break
        
      case 'location':
        if (!formData.location.address.trim()) newErrors.address = 'Address is required'
        if (!formData.location.city.trim()) newErrors.city = 'City is required'
        if (!formData.location.country.trim()) newErrors.country = 'Country is required'
        break
        
      case 'pricing':
        if (formData.pricing.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0'
        if (formData.pricing.cleaningFee < 0) newErrors.cleaningFee = 'Cleaning fee cannot be negative'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    const steps: (typeof currentStep)[] = ['basic', 'location', 'details', 'amenities', 'photos', 'pricing']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    const steps: (typeof currentStep)[] = ['basic', 'location', 'details', 'amenities', 'photos', 'pricing']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    } else {
      // Go back to previous onboarding step
      router.push('/onboarding/role-selection')
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/host/create-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update context
        completeStep('listing-creation')
        const nextStep = getNextStep('listing-creation', role!)
        setStep(nextStep)

        // Update session after creating listing
        await updateSession()
        
        // Small delay to ensure session is fully updated
        await new Promise(resolve => setTimeout(resolve, 300))

        if (onComplete) {
          onComplete()
        } else {
          // Simple client-side navigation
          router.push(`/onboarding/${nextStep}`)
        }
      } else {
        setErrors({ general: result.error || 'Failed to create listing' })
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Home className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Basic Information</h3>
              <p className="text-muted-foreground">Tell us about your property</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Property Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  placeholder="e.g., Cozy Apartment in City Center"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Property Type *</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {propertyTypes.map((type) => (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-all ${
                        formData.propertyType === type.id
                          ? 'ring-2 ring-primary border-primary'
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => updateFormData({ propertyType: type.id })}
                    >
                      <CardContent className="p-3 text-center">
                        <type.icon className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{type.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Describe your property, its features, and what makes it special..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md resize-none ${
                    errors.description ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/50 characters minimum</p>
              </div>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Location Details</h3>
              <p className="text-muted-foreground">Where is your property located?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Street Address *</label>
                <Input
                  value={formData.location.address}
                  onChange={(e) => updateNestedData('location', 'address', e.target.value)}
                  placeholder="123 Main Street"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">City *</label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => updateNestedData('location', 'city', e.target.value)}
                    placeholder="Paris"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Country *</label>
                  <Input
                    value={formData.location.country}
                    onChange={(e) => updateNestedData('location', 'country', e.target.value)}
                    placeholder="France"
                    className={errors.country ? 'border-red-500' : ''}
                  />
                  {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Home className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Property Details</h3>
              <p className="text-muted-foreground">Tell us about the space</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground">Max Guests</label>
                <div className="flex items-center mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ maxGuests: Math.max(1, formData.maxGuests - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 font-medium">{formData.maxGuests}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ maxGuests: Math.min(50, formData.maxGuests + 1) })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Bedrooms</label>
                <div className="flex items-center mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ bedrooms: Math.max(1, formData.bedrooms - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 font-medium">{formData.bedrooms}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ bedrooms: Math.min(20, formData.bedrooms + 1) })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Bathrooms</label>
                <div className="flex items-center mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ bathrooms: Math.max(1, formData.bathrooms - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 font-medium">{formData.bathrooms}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ bathrooms: Math.min(20, formData.bathrooms + 1) })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'amenities':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Wifi className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Amenities</h3>
              <p className="text-muted-foreground">What does your property offer?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(PROPERTY_AMENITIES).map(([key, label]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all ${
                    formData.amenities[key]
                      ? 'ring-2 ring-primary border-primary bg-primary/10'
                      : 'border-border hover:border-border/80'
                  }`}
                  onClick={() => updateFormData({
                    amenities: { ...formData.amenities, [key]: !formData.amenities[key] }
                  })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      {formData.amenities[key] && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Select all amenities that apply. This helps guests find properties that meet their needs.
            </p>
          </div>
        )

      case 'photos':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Property Photos</h3>
              <p className="text-muted-foreground">Show off your space with high-quality photos</p>
            </div>

            <ImageUpload
              multiple={true}
              maxFiles={20}
              maxSizeInMB={15}
              placeholder="Upload property photos - first image will be your main photo"
              onUploadComplete={(images) => {
                const urls = images.map(img => img.url)
                setFormData(prev => ({
                  ...prev,
                  photos: [...prev.photos, ...urls]
                }))
              }}
              disabled={isSubmitting}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Photo Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload at least 5 photos for better visibility</li>
                <li>• Include photos of all main areas (living room, bedrooms, kitchen, bathroom)</li>
                <li>• Take photos during the day with natural lighting</li>
                <li>• The first photo will be your main listing image</li>
              </ul>
            </div>

            {/* Show existing demo photos if any */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index)
                        }))
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>

                    {photo.includes('unsplash') && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          Demo
                        </div>
                      </div>
                    )}

                    {/* Main Photo Indicator */}
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                          Main Photo
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Euro className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Pricing</h3>
              <p className="text-muted-foreground">Set your nightly rate</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Base Price per Night *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      type="number"
                      value={formData.pricing.basePrice}
                      onChange={(e) => updateNestedData('pricing', 'basePrice', Number(e.target.value))}
                      placeholder="100"
                      className={`pl-8 ${errors.basePrice ? 'border-red-500' : ''}`}
                      min="1"
                    />
                  </div>
                  {errors.basePrice && <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Cleaning Fee</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      type="number"
                      value={formData.pricing.cleaningFee}
                      onChange={(e) => updateNestedData('pricing', 'cleaningFee', Number(e.target.value))}
                      placeholder="25"
                      className={`pl-8 ${errors.cleaningFee ? 'border-red-500' : ''}`}
                      min="0"
                    />
                  </div>
                  {errors.cleaningFee && <p className="text-sm text-red-600 mt-1">{errors.cleaningFee}</p>}
                </div>
              </div>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-medium text-primary mb-2">Pricing Tips</h4>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• Research similar properties in your area</li>
                    <li>• Consider seasonal demand fluctuations</li>
                    <li>• Start competitive and adjust based on bookings</li>
                    <li>• Factor in your costs (utilities, maintenance, etc.)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  const getStepTitle = () => {
    const titles = {
      basic: 'Basic Information',
      location: 'Location Details', 
      details: 'Property Details',
      amenities: 'Amenities',
      photos: 'Photos',
      pricing: 'Pricing'
    }
    return titles[currentStep]
  }

  const getProgressPercentage = () => {
    const steps = ['basic', 'location', 'details', 'amenities', 'photos', 'pricing']
    const currentIndex = steps.indexOf(currentStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
          <span>Step {['basic', 'location', 'details', 'amenities', 'photos', 'pricing'].indexOf(currentStep) + 1} of 6</span>
          <span>{Math.round(getProgressPercentage())}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

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
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isSubmitting}
        >
          {currentStep === 'basic' ? 'Back to Role Selection' : 'Previous'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Creating...' : currentStep === 'pricing' ? 'Create Listing' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
