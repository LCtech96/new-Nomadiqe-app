import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { geocodingService } from '@/lib/geocoding'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const listingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'BNB', 'HOTEL', 'HOSTEL', 'CABIN', 'COTTAGE', 'LOFT', 'CAMPER', 'TENT', 'OTHER']),
  maxGuests: z.number().min(1, 'Must accommodate at least 1 guest').max(50),
  bedrooms: z.number().min(1, 'Must have at least 1 bedroom').max(20),
  bathrooms: z.number().min(1, 'Must have at least 1 bathroom').max(20),
  amenities: z.object({
    wifi: z.boolean().default(false),
    airConditioning: z.boolean().default(false),
    heating: z.boolean().default(false),
    tv: z.boolean().default(false),
    kitchen: z.boolean().default(false),
    washingMachine: z.boolean().default(false),
    dryer: z.boolean().default(false),
    refrigerator: z.boolean().default(false),
    dishwasher: z.boolean().default(false),
    coffeeMachine: z.boolean().default(false),
    balcony: z.boolean().default(false),
    seaView: z.boolean().default(false),
    pool: z.boolean().default(false),
    jacuzzi: z.boolean().default(false),
    gym: z.boolean().default(false),
    fireplace: z.boolean().default(false),
    workspace: z.boolean().default(false),
    towels: z.boolean().default(false),
    shampoo: z.boolean().default(false),
    toiletPaper: z.boolean().default(false),
    hairDryer: z.boolean().default(false),
    iron: z.boolean().default(false),
    crib: z.boolean().default(false),
    highChair: z.boolean().default(false),
    toys: z.boolean().default(false),
    elevator: z.boolean().default(false),
    wheelchairAccessible: z.boolean().default(false),
    parking: z.boolean().default(false),
    privateEntrance: z.boolean().default(false),
    smokeDetector: z.boolean().default(false),
    carbonMonoxide: z.boolean().default(false),
    fireExtinguisher: z.boolean().default(false),
    firstAidKit: z.boolean().default(false),
    securityCameras: z.boolean().default(false)
  }),
  photos: z.array(z.string().url()).min(1, 'At least one photo is required').max(20, 'Maximum 20 photos allowed'),
  pricing: z.object({
    basePrice: z.number().min(1, 'Base price must be greater than 0'),
    cleaningFee: z.number().min(0, 'Cleaning fee cannot be negative'),
    currency: z.string().default('EUR')
  }),
  rules: z.array(z.string()).default([])
})

export async function POST(req: NextRequest) {
  let body: any = null
  let session: any = null

  try {
    session = await getServerSession(authOptions)
    
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
      console.error('[Create Listing] User not found:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check role - if not HOST but has hostProfile, allow but log warning
    if (user.role !== 'HOST') {
      // If user has hostProfile but wrong role, fix the role and allow
      if (user.hostProfile) {
        console.warn('[Create Listing] Role mismatch but hostProfile exists:', {
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
        console.error('[Create Listing] Role mismatch and no hostProfile:', {
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

    body = await req.json()
    
    console.log('[Create Listing] Received request body:', {
      hasTitle: !!body.title,
      hasDescription: !!body.description,
      hasLocation: !!body.location,
      hasPropertyType: !!body.propertyType,
      hasPhotos: !!body.photos,
      photosCount: body.photos?.length || 0,
      hasPricing: !!body.pricing,
      hasAmenities: !!body.amenities
    })

    const validatedData = listingSchema.parse(body)
    
    console.log('[Create Listing] Validation passed, proceeding with listing creation')

    // Convert amenities object to string array format expected by Property model
    const amenitiesArray: string[] = []
    Object.entries(validatedData.amenities).forEach(([key, value]) => {
      if (value === true) {
        amenitiesArray.push(key)
      }
    })

    // Geocode the address if coordinates are not provided
    let latitude = validatedData.location.latitude
    let longitude = validatedData.location.longitude
    let geocodingAccuracy: string | null = null
    let geocodingFailed = false

    if (!latitude || !longitude) {
      console.log('Geocoding address:', {
        address: validatedData.location.address,
        city: validatedData.location.city,
        country: validatedData.location.country
      })

      const geocodingResult = await geocodingService.geocodeAddressWithFallback(
        validatedData.location.address,
        validatedData.location.city,
        validatedData.location.country
      )

      if (geocodingResult) {
        latitude = geocodingResult.latitude
        longitude = geocodingResult.longitude
        geocodingAccuracy = geocodingResult.accuracy
        console.log('Geocoding successful:', {
          latitude,
          longitude,
          accuracy: geocodingAccuracy
        })
      } else {
        geocodingFailed = true
        console.warn('Geocoding failed - property will be created without coordinates')
      }
    }

    // Create the property listing
    console.log('[Create Listing] Creating property with data:', {
      title: validatedData.title.substring(0, 50),
      type: validatedData.propertyType,
      hostId: session.user.id,
      amenitiesCount: amenitiesArray.length,
      photosCount: validatedData.photos.length,
      hasCoordinates: !!(latitude && longitude)
    })

    let property
    try {
      const propertyData = {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.propertyType,
        address: validatedData.location.address,
        city: validatedData.location.city,
        country: validatedData.location.country,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        geocodingAccuracy,
        geocodingFailed,
        price: validatedData.pricing.basePrice,
        currency: validatedData.pricing.currency || 'EUR',
        maxGuests: validatedData.maxGuests,
        bedrooms: validatedData.bedrooms,
        bathrooms: validatedData.bathrooms,
        amenities: amenitiesArray,
        images: validatedData.photos,
        rules: validatedData.rules || [],
        hostId: session.user.id,
        isActive: true,
        isVerified: false
      }

      console.log('[Create Listing] Attempting to create property with data:', {
        title: propertyData.title.substring(0, 50),
        type: propertyData.type,
        hostId: propertyData.hostId,
        amenitiesCount: propertyData.amenities.length,
        photosCount: propertyData.images.length,
        hasCoordinates: !!(propertyData.latitude && propertyData.longitude)
      })

      property = await prisma.property.create({
        data: propertyData
      })
      console.log('[Create Listing] Property created successfully:', property.id)
    } catch (dbError: any) {
      // Enhanced Prisma error handling - check error codes first (more reliable than instanceof)
      const errorCode = dbError?.code
      const errorMessage = dbError?.message || 'Unknown database error'
      
      console.error('[Create Listing] Database error during property creation:', {
        message: errorMessage,
        code: errorCode,
        meta: dbError?.meta,
        stack: dbError?.stack,
        name: dbError?.name,
        // Log the specific error type if available
        isPrismaKnownError: errorCode && typeof errorCode === 'string' && errorCode.startsWith('P'),
        errorClassName: dbError?.constructor?.name
      })

      // Handle specific Prisma error codes (using code check first, more reliable)
      if (errorCode === 'P2002') {
        console.error('[Create Listing] Unique constraint violation:', dbError.meta)
        return NextResponse.json(
          { error: 'A property with these details already exists', code: errorCode },
          { status: 400 }
        )
      }
      
      if (errorCode === 'P2003') {
        console.error('[Create Listing] Foreign key constraint violation:', dbError.meta)
        return NextResponse.json(
          { error: 'Invalid reference. Please ensure all required data is correct.', code: errorCode },
          { status: 400 }
        )
      }

      // Handle Prisma validation errors (check by name or code)
      if (dbError?.constructor?.name === 'PrismaClientValidationError' || 
          errorMessage?.includes('Unknown argument') ||
          errorMessage?.includes('Invalid value')) {
        console.error('[Create Listing] Prisma validation error - data does not match schema:', errorMessage)
        return NextResponse.json(
          { error: 'Invalid property data format. Please check all fields are correct.', details: errorMessage },
          { status: 400 }
        )
      }

      // Try instanceof checks as fallback
      try {
        if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
          console.error('[Create Listing] Prisma known error (via instanceof):', {
            code: dbError.code,
            meta: dbError.meta
          })
        }
      } catch (e) {
        // instanceof check failed, continue with code-based handling
      }

      throw dbError // Re-throw to be caught by outer catch block
    }

    // Update user onboarding step
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: 'collaboration-setup'
      }
    })

    // Update progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id }
    })

    if (progress) {
      const completedSteps = JSON.parse(progress.completedSteps as string)
      completedSteps.push('listing-creation')
      
      await prisma.onboardingProgress.update({
        where: { userId: session.user.id },
        data: {
          currentStep: 'collaboration-setup',
          completedSteps: JSON.stringify(completedSteps)
        }
      })
    }

    return NextResponse.json({
      listingId: property.id,
      success: true,
      nextStep: 'collaboration-setup',
      message: 'Property listing created successfully. Your listing will be reviewed before being published.'
    })

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('[Create Listing] Zod validation error:', {
        errors: error.errors,
        receivedData: body ? JSON.stringify(body, null, 2) : 'Body not parsed yet'
      })
      return NextResponse.json(
        { error: 'Invalid listing data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Prisma errors by error code (in case they weren't caught earlier)
    const errorCode = error?.code
    if (errorCode && typeof errorCode === 'string' && errorCode.startsWith('P')) {
      console.error('[Create Listing] Prisma error (caught in outer catch):', {
        code: errorCode,
        meta: error?.meta,
        message: error?.message
      })
      
      // Handle specific error codes
      if (errorCode === 'P2002') {
        return NextResponse.json(
          { error: 'A property with these details already exists', code: errorCode },
          { status: 400 }
        )
      }
      if (errorCode === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference. Please check your data.', code: errorCode },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Database error occurred while creating listing',
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 500 }
      )
    }

    // Try instanceof check as fallback
    try {
      if (error instanceof Prisma.PrismaClientValidationError) {
        console.error('[Create Listing] Prisma validation error (caught in outer catch):', error.message)
        return NextResponse.json(
          { error: 'Invalid property data format', details: error.message },
          { status: 400 }
        )
      }
    } catch (e) {
      // instanceof check failed, continue with general error handling
    }

    // Enhanced error logging for all other errors
    let errorDetails: any = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name || typeof error,
      userId: session?.user?.id,
      bodyParsed: !!body,
      bodyPreview: body ? {
        hasTitle: !!body.title,
        hasDescription: !!body.description,
        hasLocation: !!body.location,
        propertyType: body.propertyType,
        photosCount: body.photos?.length || 0
      } : null
    }

    // Safely serialize error object (handle circular references)
    try {
      errorDetails.errorString = String(error)
      if (error && typeof error === 'object') {
        errorDetails.errorKeys = Object.keys(error)
        errorDetails.errorCode = (error as any)?.code
      }
    } catch (e) {
      errorDetails.errorSerializationFailed = true
    }

    console.error('[Create Listing] Unhandled error:', errorDetails)

    return NextResponse.json(
      { 
        error: 'Failed to create listing', 
        code: 'ONBOARDING_005',
        details: process.env.NODE_ENV === 'development' 
          ? (error?.message || 'Unknown error occurred')
          : 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    )
  }
}
