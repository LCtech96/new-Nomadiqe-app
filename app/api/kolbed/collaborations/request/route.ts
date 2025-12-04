import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const collaborationRequestSchema = z.object({
  hostId: z.string(),
  propertyId: z.string().optional(),
  message: z.string().optional(),
  proposedDates: z.object({
    startDate: z.string(),
    endDate: z.string()
  }).optional()
})

/**
 * POST /api/kolbed/collaborations/request
 * Creator richiede collaborazione con un host
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

    // Verify user is a creator
    const creator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        influencerProfile: true,
        socialConnections: true
      }
    })

    if (!creator || creator.role !== 'INFLUENCER') {
      return NextResponse.json(
        { error: 'Only creators can request collaborations' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = collaborationRequestSchema.parse(body)

    // Verify host exists and has host profile
    const host = await prisma.user.findUnique({
      where: { id: validatedData.hostId },
      include: { hostProfile: true }
    })

    if (!host || host.role !== 'HOST' || !host.hostProfile) {
      return NextResponse.json(
        { error: 'Invalid host' },
        { status: 404 }
      )
    }

    // Check if creator meets host requirements
    const totalFollowers = creator.socialConnections.reduce(
      (sum: number, conn: any) => sum + (conn.followerCount || 0),
      0
    )

    if (host.hostProfile.minFollowerCount && totalFollowers < host.hostProfile.minFollowerCount) {
      return NextResponse.json(
        {
          error: 'Follower count requirement not met',
          required: host.hostProfile.minFollowerCount,
          current: totalFollowers
        },
        { status: 400 }
      )
    }

    // Check if collaboration already exists
    const existingCollab = await prisma.collaboration.findFirst({
      where: {
        hostId: validatedData.hostId,
        creatorId: session.user.id,
        status: {
          in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
        }
      }
    })

    if (existingCollab) {
      return NextResponse.json(
        { error: 'You already have an active collaboration request with this host' },
        { status: 400 }
      )
    }

    // Get host's standard offer
    const standardOffer = host.hostProfile.standardOffer as any

    // Create collaboration request
    const collaboration = await prisma.collaboration.create({
      data: {
        hostId: validatedData.hostId,
        creatorId: session.user.id,
        propertyId: validatedData.propertyId,
        offerType: standardOffer?.offerType || 'free_stay',
        discountPercent: standardOffer?.discount,
        nightsCount: standardOffer?.minNights,
        deliverables: standardOffer?.deliverables || [],
        terms: standardOffer?.terms,
        notes: validatedData.message,
        ...(validatedData.proposedDates ? {
          startDate: new Date(validatedData.proposedDates.startDate),
          endDate: new Date(validatedData.proposedDates.endDate)
        } : {})
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    // TODO: Send notification to host

    return NextResponse.json({
      success: true,
      collaboration
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create collaboration request error:', error)
    return NextResponse.json(
      { error: 'Failed to create collaboration request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/kolbed/collaborations/request
 * Get collaboration requests (for host or creator)
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause based on user role
    const whereClause: any = {}
    
    if (user.role === 'HOST') {
      whereClause.hostId = session.user.id
    } else if (user.role === 'INFLUENCER') {
      whereClause.creatorId = session.user.id
    } else {
      return NextResponse.json(
        { error: 'Only hosts and creators can view collaborations' },
        { status: 403 }
      )
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const collaborations = await prisma.collaboration.findMany({
      where: whereClause,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            city: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      collaborations,
      count: collaborations.length
    })

  } catch (error) {
    console.error('Fetch collaboration requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaboration requests' },
      { status: 500 }
    )
  }
}
