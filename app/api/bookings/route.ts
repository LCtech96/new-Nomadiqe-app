import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const bookingSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().min(1),
  notes: z.string().optional(),
  referralCode: z.string().optional()
})

/**
 * POST /api/bookings
 * Create a new booking with referral tracking
 */
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
    
    // Check for referral code in body or cookie
    let referralCode = body.referralCode
    if (!referralCode) {
      const cookies = req.cookies
      referralCode = cookies.get('nomadiqe_referral')?.value
    }

    const validatedData = bookingSchema.parse({
      ...body,
      referralCode
    })

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            fullName: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check availability (TODO: implement proper availability check)
    const checkIn = new Date(validatedData.checkIn)
    const checkOut = new Date(validatedData.checkOut)
    
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400 }
      )
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const basePrice = property.price * nights

    // Handle referral tracking
    let referralCreatorId: string | null = null
    let commissionRate = 0
    let commissionAmount = 0
    let totalPrice = basePrice

    if (referralCode) {
      // Find creator by referral code
      const influencerProfile = await prisma.influencerProfile.findUnique({
        where: { referralCode },
        include: { user: true }
      })

      if (influencerProfile && influencerProfile.user.role === 'INFLUENCER') {
        referralCreatorId = influencerProfile.userId
        
        // Commission rate: 0.5% by default (configurable per property/host)
        commissionRate = 0.5
        commissionAmount = (basePrice * commissionRate) / 100
        totalPrice = basePrice + commissionAmount

        console.log('[BOOKING] Referral detected:', {
          referralCode,
          creatorId: referralCreatorId,
          creatorName: influencerProfile.user.fullName,
          basePrice,
          commissionRate,
          commissionAmount,
          totalPrice
        })
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        propertyId: validatedData.propertyId,
        travelerId: session.user.id,
        checkIn,
        checkOut,
        guests: validatedData.guests,
        totalPrice,
        currency: property.currency,
        status: 'PENDING',
        notes: validatedData.notes,
        referralCode: referralCode || null,
        referralCreatorId: referralCreatorId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            city: true,
            country: true,
            price: true
          }
        },
        traveler: {
          select: {
            id: true,
            name: true,
            fullName: true,
            email: true
          }
        },
        referralCreator: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    // If referral, create commission record and update click
    if (referralCreatorId && referralCode) {
      // Find the referral click that led to this booking
      const referralClick = await prisma.referralClick.findFirst({
        where: {
          referralCode,
          creatorId: referralCreatorId,
          convertedToBooking: false
        },
        orderBy: {
          clickedAt: 'desc'
        }
      })

      if (referralClick) {
        // Update click as converted
        await prisma.referralClick.update({
          where: { id: referralClick.id },
          data: {
            convertedToBooking: true,
            bookingId: booking.id
          }
        })
      }

      // Create commission record
      await prisma.creatorCommission.create({
        data: {
          creatorId: referralCreatorId,
          bookingId: booking.id,
          referralClickId: referralClick?.id,
          commissionRate,
          bookingAmount: basePrice,
          commissionAmount,
          status: 'PENDING'
        }
      })

      // Update creator's pending commissions
      await prisma.influencerProfile.update({
        where: { userId: referralCreatorId },
        data: {
          pendingCommissions: {
            increment: commissionAmount
          }
        }
      })

      console.log('[BOOKING] Creator commission created:', {
        creatorId: referralCreatorId,
        bookingId: booking.id,
        commissionAmount
      })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalPrice: booking.totalPrice,
        basePrice,
        commissionAmount,
        property: booking.property,
        referralCreator: booking.referralCreator
      },
      redirectTo: `/bookings/${booking.id}/checkout`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings
 * Get user's bookings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        travelerId: session.user.id
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            city: true,
            country: true,
            host: {
              select: {
                id: true,
                name: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      bookings,
      count: bookings.length
    })

  } catch (error) {
    console.error('Fetch bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

